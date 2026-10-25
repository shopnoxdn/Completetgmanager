import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from telethon.errors import FrozenMethodInvalidError

from server import phone_country_code, session_counts


class PhoneCountryCodeTests(unittest.TestCase):
    def test_resolves_countries_sharing_the_north_american_code(self):
        self.assertEqual(phone_country_code("+1 767 320 1234"), "DM")
        self.assertEqual(phone_country_code("+1 829 555 1234"), "DO")

    def test_resolves_international_number(self):
        self.assertEqual(phone_country_code("+880 1712 345678"), "BD")

    def test_returns_none_for_unparseable_number(self):
        self.assertIsNone(phone_country_code("not-a-phone-number"))


class FakeTelegramClient:
    def __init__(self, authorizations=None, error=None):
        self.authorizations = authorizations or []
        self.error = error

    async def connect(self):
        pass

    async def disconnect(self):
        pass

    async def __call__(self, _request):
        if self.error:
            raise self.error
        return SimpleNamespace(authorizations=self.authorizations)


class SessionCountTests(unittest.TestCase):
    def load_counts(self, client):
        with (
            patch("server.db_all", return_value=[{"phone": "+18005550123"}]),
            patch("server.make_client", return_value=client),
        ):
            return asyncio.run(session_counts())

    def test_returns_connected_device_count(self):
        counts = self.load_counts(FakeTelegramClient(authorizations=[1, 2]))
        self.assertEqual(counts["+18005550123"], {"count": 2, "frozen": False})

    def test_marks_explicit_frozen_account_response(self):
        error = FrozenMethodInvalidError(None)
        counts = self.load_counts(FakeTelegramClient(error=error))
        self.assertEqual(counts["+18005550123"], {"count": None, "frozen": True})

    def test_does_not_mislabel_other_errors_as_frozen(self):
        counts = self.load_counts(FakeTelegramClient(error=RuntimeError("offline")))
        self.assertEqual(counts["+18005550123"], {"count": None, "frozen": False})


if __name__ == "__main__":
    unittest.main()
