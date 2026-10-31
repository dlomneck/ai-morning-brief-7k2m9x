import contextlib
import io
import os
import unittest
from unittest.mock import patch

import linkedin_weekly as weekly


class WeeklyTests(unittest.TestCase):
    def setUp(self):
        self.articles = [{'id': 1, 'text': 'An exact supporting excerpt.', 'url': 'https://example.com/story'}]
        self.draft = {'publish': True, 'post': ' '.join(['word'] * 160), 'angle': 'Proposed opinion',
                      'assumptions': ['Confirm this view.'], 'source_ids': [1],
                      'evidence': [{'source_id': 1, 'quote': 'An exact supporting excerpt.'}]}

    def test_requires_actual_evidence_and_valid_sources(self):
        weekly.validate(self.draft, self.articles)
        self.draft['evidence'][0]['quote'] = 'Invented quotation'
        with self.assertRaises(ValueError): weekly.validate(self.draft, self.articles)
        self.draft['source_ids'] = [99]
        with self.assertRaises(ValueError): weekly.validate(self.draft, self.articles)

    def test_rejects_unsafe_article_urls(self):
        for url in ['http://openai.com/x', 'https://127.0.0.1/x', 'https://openai.com:444/x', 'https://openai.com@localhost/x']:
            with self.assertRaises(ValueError): weekly.checked_url(url)

    def test_dry_run_never_sends_or_logs_draft(self):
        output = io.StringIO()
        with patch.dict(os.environ, {'LINKEDIN_FREE_TIER_CONFIRMED': 'true', 'GEMINI_API_KEY': 'test', 'GITHUB_RUN_ATTEMPT': '1'}, clear=True), \
             patch.object(weekly, 'collect_articles', return_value=self.articles), \
             patch.object(weekly, 'generate', return_value=self.draft), \
             patch.object(weekly, 'send_email') as send, contextlib.redirect_stdout(output):
            self.assertEqual(weekly.main([]), 0)
            send.assert_not_called()
        self.assertNotIn(self.draft['post'], output.getvalue())

    def test_provider_errors_do_not_leak_content(self):
        output = io.StringIO()
        with patch.dict(os.environ, {'LINKEDIN_FREE_TIER_CONFIRMED': 'true', 'GEMINI_API_KEY': 'test'}, clear=True), \
             patch.object(weekly, 'collect_articles', return_value=self.articles), \
             patch.object(weekly, 'generate', side_effect=RuntimeError('PRIVATE DRAFT BODY')), contextlib.redirect_stderr(output):
            self.assertEqual(weekly.main([]), 1)
        self.assertNotIn('PRIVATE', output.getvalue())

    def test_no_network_without_free_tier_confirmation(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(weekly, 'collect_articles') as collect, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(weekly.main([]), 1)
            collect.assert_not_called()

    def test_reruns_refused(self):
        with patch.dict(os.environ, {'LINKEDIN_FREE_TIER_CONFIRMED': 'true', 'GITHUB_RUN_ATTEMPT': '2'}, clear=True), patch.object(weekly, 'collect_articles') as collect, contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(weekly.main([]), 1)
            collect.assert_not_called()

    def test_skip_cannot_smuggle_post(self):
        self.draft['publish'] = False
        with self.assertRaises(ValueError): weekly.validate(self.draft, self.articles)
        self.draft['post'] = ''
        weekly.validate(self.draft, self.articles)


if __name__ == '__main__':
    unittest.main()
