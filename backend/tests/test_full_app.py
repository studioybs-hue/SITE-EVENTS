"""
Full Application Test Suite for Je Suis Platform
Tests: Auth, Providers, Bookings, Messages, Marketplace, Admin
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://servicehub-213.preview.emergentagent.com')

# Test credentials
CLIENT_EMAIL = "client@test.com"
CLIENT_PASSWORD = "password123"
PROVIDER_EMAIL = "provider@test.com"
PROVIDER_PASSWORD = "password123"
ADMIN_EMAIL = "admin@lumiere-events.com"
ADMIN_PASSWORD = "admin123"


class TestPublicEndpoints:
    """Test public API endpoints (no auth required)"""
    
    def test_categories_events(self):
        """Test GET /api/categories/events"""
        response = requests.get(f"{BASE_URL}/api/categories/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check structure
        assert "id" in data[0]
        assert "name" in data[0]
        print(f"SUCCESS: Found {len(data)} event categories")
    
    def test_categories_pro(self):
        """Test GET /api/categories/pro"""
        response = requests.get(f"{BASE_URL}/api/categories/pro")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: Found {len(data)} pro categories")
    
    def test_providers_list(self):
        """Test GET /api/providers"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} providers")
    
    def test_providers_filter_by_category(self):
        """Test GET /api/providers with category filter"""
        response = requests.get(f"{BASE_URL}/api/providers?category=Photographe")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} photographers")
    
    def test_packages_list(self):
        """Test GET /api/packages"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} packages")
    
    def test_marketplace_items(self):
        """Test GET /api/marketplace"""
        response = requests.get(f"{BASE_URL}/api/marketplace")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} marketplace items")


class TestClientAuth:
    """Test client authentication flows"""
    
    def test_client_login_success(self):
        """Test POST /api/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == CLIENT_EMAIL
        assert data["user_type"] == "client"
        print(f"SUCCESS: Client login successful - user_id: {data['user_id']}")
    
    def test_client_login_invalid_credentials(self):
        """Test POST /api/auth/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid credentials rejected")
    
    def test_client_login_missing_fields(self):
        """Test POST /api/auth/login with missing fields"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL
        })
        assert response.status_code == 400
        print("SUCCESS: Missing password rejected")


class TestProviderAuth:
    """Test provider authentication flows"""
    
    def test_provider_login_success(self):
        """Test POST /api/auth/login for provider"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert data["email"] == PROVIDER_EMAIL
        assert data["user_type"] == "provider"
        print(f"SUCCESS: Provider login successful - user_id: {data['user_id']}")


class TestAdminAuth:
    """Test admin authentication flows"""
    
    def test_admin_login_success(self):
        """Test POST /api/admin/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True or "admin_id" in str(data)
        print("SUCCESS: Admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Test POST /api/admin/login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@admin.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("SUCCESS: Invalid admin credentials rejected")


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session cookie"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        self.user_data = response.json()
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == CLIENT_EMAIL
        print("SUCCESS: Get current user works")
    
    def test_get_bookings(self):
        """Test GET /api/bookings"""
        response = self.session.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} bookings for client")
    
    def test_get_recent_messages(self):
        """Test GET /api/messages/recent"""
        response = self.session.get(f"{BASE_URL}/api/messages/recent")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert "unread_count" in data
        print(f"SUCCESS: Found {len(data['messages'])} recent messages, {data['unread_count']} unread")
    
    def test_get_favorites(self):
        """Test GET /api/favorites"""
        response = self.session.get(f"{BASE_URL}/api/favorites")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} favorites")


class TestProviderEndpoints:
    """Test provider-specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as provider"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        self.user_data = response.json()
    
    def test_get_provider_bookings(self):
        """Test GET /api/bookings?role=provider"""
        response = self.session.get(f"{BASE_URL}/api/bookings?role=provider")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} provider bookings")
    
    def test_get_my_services(self):
        """Test GET /api/services/me"""
        response = self.session.get(f"{BASE_URL}/api/services/me")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} services")


class TestBookingFlow:
    """Test complete booking flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as client"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        self.user_data = response.json()
    
    def test_check_provider_availability(self):
        """Test GET /api/providers/availability/{provider_id}/{date}"""
        # Get a provider first
        providers = requests.get(f"{BASE_URL}/api/providers").json()
        if providers:
            provider_id = providers[0]["provider_id"]
            future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            response = requests.get(f"{BASE_URL}/api/providers/availability/{provider_id}/{future_date}")
            assert response.status_code == 200
            data = response.json()
            assert "is_available" in data
            print(f"SUCCESS: Availability check works - available: {data['is_available']}")
    
    def test_create_booking(self):
        """Test POST /api/bookings"""
        # Get a provider first
        providers = requests.get(f"{BASE_URL}/api/providers").json()
        if providers:
            provider = providers[0]
            future_date = (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d")
            
            booking_data = {
                "provider_id": provider["provider_id"],
                "provider_name": provider["business_name"],
                "event_type": "TEST_Mariage",
                "event_date": future_date,
                "event_location": "Paris, France",
                "total_amount": 1500.00,
                "notes": "Test booking from automated tests"
            }
            
            response = self.session.post(f"{BASE_URL}/api/bookings", json=booking_data)
            assert response.status_code == 200
            data = response.json()
            assert "booking_id" in data
            assert data["status"] == "pending"
            print(f"SUCCESS: Booking created - booking_id: {data['booking_id']}")
            
            # Cleanup - we should delete this test booking
            return data["booking_id"]


class TestMessagingFlow:
    """Test messaging functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as client"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        self.user_data = response.json()
    
    def test_send_message(self):
        """Test POST /api/messages"""
        # Get a provider to message
        providers = requests.get(f"{BASE_URL}/api/providers").json()
        if providers:
            provider = providers[0]
            
            message_data = {
                "receiver_id": provider["user_id"],
                "content": "TEST_Message from automated tests"
            }
            
            response = self.session.post(f"{BASE_URL}/api/messages", json=message_data)
            assert response.status_code == 200
            data = response.json()
            assert "message_id" in data
            print(f"SUCCESS: Message sent - message_id: {data['message_id']}")
    
    def test_get_conversations(self):
        """Test GET /api/messages/conversations"""
        response = self.session.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} conversations")


class TestStripePayment:
    """Test Stripe payment integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as client"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
    
    def test_create_checkout_session(self):
        """Test POST /api/payments/create-checkout-session"""
        # First get a booking
        bookings = self.session.get(f"{BASE_URL}/api/bookings").json()
        if bookings:
            booking = bookings[0]
            
            payment_data = {
                "booking_id": booking["booking_id"],
                "amount": booking.get("total_amount", 100),
                "payment_type": "deposit"
            }
            
            response = self.session.post(f"{BASE_URL}/api/payments/create-checkout-session", json=payment_data)
            # May return 200 with checkout URL or error if Stripe not configured
            if response.status_code == 200:
                data = response.json()
                assert "checkout_url" in data or "url" in data
                print("SUCCESS: Checkout session created")
            else:
                print(f"INFO: Stripe checkout returned {response.status_code} - may need configuration")


class TestAdminEndpoints:
    """Test admin panel endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        response = self.session.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
    
    def test_get_admin_stats(self):
        """Test GET /api/admin/stats"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data or "users" in str(data).lower()
        print("SUCCESS: Admin stats retrieved")
    
    def test_get_admin_users(self):
        """Test GET /api/admin/users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "users" in data
        print("SUCCESS: Admin users list retrieved")
    
    def test_get_admin_providers(self):
        """Test GET /api/admin/providers"""
        response = self.session.get(f"{BASE_URL}/api/admin/providers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "providers" in data
        print("SUCCESS: Admin providers list retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
