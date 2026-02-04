"""
Test suite for Dashboard and Availability features
Tests:
- Provider dashboard: calendar, stats, pending requests
- Client dashboard: tabs, quick actions
- Availability API: GET and POST endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PROVIDER_EMAIL = "provider@test.com"
PROVIDER_PASSWORD = "password123"
CLIENT_EMAIL = "client@test.com"
CLIENT_PASSWORD = "password123"


class TestProviderLogin:
    """Provider authentication tests"""
    
    def test_provider_login_success(self):
        """Test successful login with provider credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert data["email"] == PROVIDER_EMAIL
        assert data["user_type"] == "provider"


class TestClientLogin:
    """Client authentication tests"""
    
    def test_client_login_success(self):
        """Test successful login with client credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert data["email"] == CLIENT_EMAIL
        assert data["user_type"] == "client"


class TestProviderProfile:
    """Provider profile endpoint tests"""
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated provider session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session, response.json()
    
    def test_get_provider_profile_by_user_id(self, provider_session):
        """Test GET /api/providers/user/{user_id} returns provider profile"""
        session, user_data = provider_session
        user_id = user_data["user_id"]
        
        response = session.get(f"{BASE_URL}/api/providers/user/{user_id}")
        assert response.status_code == 200, f"Failed to get provider profile: {response.text}"
        
        data = response.json()
        assert "provider_id" in data
        assert data["user_id"] == user_id
        assert "business_name" in data
        assert "category" in data
        assert "rating" in data
        assert "total_reviews" in data


class TestAvailabilityEndpoints:
    """Availability API endpoint tests"""
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated provider session with provider_id"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        user_data = response.json()
        
        # Get provider profile
        profile_response = session.get(f"{BASE_URL}/api/providers/user/{user_data['user_id']}")
        assert profile_response.status_code == 200
        provider_data = profile_response.json()
        
        return session, provider_data["provider_id"]
    
    def test_get_availability_for_month(self, provider_session):
        """Test GET /api/availability/{provider_id}?month=YYYY-MM"""
        session, provider_id = provider_session
        
        response = session.get(f"{BASE_URL}/api/availability/{provider_id}?month=2026-02")
        assert response.status_code == 200, f"Failed to get availability: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check structure if there are blocked dates
        if len(data) > 0:
            avail = data[0]
            assert "date" in avail
            assert "is_available" in avail
            assert "provider_id" in avail
    
    def test_get_availability_without_month_filter(self, provider_session):
        """Test GET /api/availability/{provider_id} without month filter"""
        session, provider_id = provider_session
        
        response = session.get(f"{BASE_URL}/api/availability/{provider_id}")
        assert response.status_code == 200, f"Failed to get availability: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_block_date(self, provider_session):
        """Test POST /api/availability to block a date"""
        session, provider_id = provider_session
        
        # Use a unique date for testing
        test_date = "2026-03-20"
        
        response = session.post(f"{BASE_URL}/api/availability", json={
            "date": test_date,
            "is_available": False,
            "notes": "TEST_Blocked for testing"
        })
        assert response.status_code == 200, f"Failed to block date: {response.text}"
        
        data = response.json()
        assert data["message"] == "Availability updated"
        
        # Verify the date is blocked
        verify_response = session.get(f"{BASE_URL}/api/availability/{provider_id}?month=2026-03")
        assert verify_response.status_code == 200
        
        availabilities = verify_response.json()
        blocked_dates = [a for a in availabilities if a["date"] == test_date]
        assert len(blocked_dates) > 0, "Blocked date not found"
        assert blocked_dates[0]["is_available"] == False
    
    def test_unblock_date(self, provider_session):
        """Test POST /api/availability to unblock a date"""
        session, provider_id = provider_session
        
        # First block a date
        test_date = "2026-03-21"
        
        block_response = session.post(f"{BASE_URL}/api/availability", json={
            "date": test_date,
            "is_available": False,
            "notes": "TEST_Blocked for unblock test"
        })
        assert block_response.status_code == 200
        
        # Now unblock it
        unblock_response = session.post(f"{BASE_URL}/api/availability", json={
            "date": test_date,
            "is_available": True,
            "notes": None
        })
        assert unblock_response.status_code == 200, f"Failed to unblock date: {unblock_response.text}"
        
        # Verify the date is unblocked
        verify_response = session.get(f"{BASE_URL}/api/availability/{provider_id}?month=2026-03")
        assert verify_response.status_code == 200
        
        availabilities = verify_response.json()
        unblocked_dates = [a for a in availabilities if a["date"] == test_date]
        assert len(unblocked_dates) > 0, "Date entry not found"
        assert unblocked_dates[0]["is_available"] == True
    
    def test_block_date_unauthenticated(self):
        """Test POST /api/availability without authentication"""
        response = requests.post(f"{BASE_URL}/api/availability", json={
            "date": "2026-03-25",
            "is_available": False,
            "notes": "Should fail"
        })
        assert response.status_code == 401, "Should require authentication"


class TestBookingsEndpoints:
    """Bookings endpoint tests for dashboard stats"""
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated provider session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def client_session(self):
        """Get authenticated client session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_provider_bookings(self, provider_session):
        """Test GET /api/bookings?role=provider"""
        response = provider_session.get(f"{BASE_URL}/api/bookings?role=provider")
        assert response.status_code == 200, f"Failed to get bookings: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_client_bookings(self, client_session):
        """Test GET /api/bookings?role=client"""
        response = client_session.get(f"{BASE_URL}/api/bookings?role=client")
        assert response.status_code == 200, f"Failed to get bookings: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_bookings_unauthenticated(self):
        """Test GET /api/bookings without authentication"""
        response = requests.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 401


class TestDashboardDataFlow:
    """Integration tests for dashboard data flow"""
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated provider session with full data"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        user_data = response.json()
        
        # Get provider profile
        profile_response = session.get(f"{BASE_URL}/api/providers/user/{user_data['user_id']}")
        assert profile_response.status_code == 200
        provider_data = profile_response.json()
        
        return session, user_data, provider_data
    
    def test_provider_dashboard_data_flow(self, provider_session):
        """
        Test complete provider dashboard data flow:
        1. Get user info via /auth/me
        2. Get provider profile
        3. Get bookings
        4. Get availability
        """
        session, user_data, provider_data = provider_session
        
        # Step 1: Verify auth/me
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["user_type"] == "provider"
        
        # Step 2: Provider profile already fetched
        assert "provider_id" in provider_data
        assert "rating" in provider_data
        assert "total_reviews" in provider_data
        
        # Step 3: Get bookings
        bookings_response = session.get(f"{BASE_URL}/api/bookings?role=provider")
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        assert isinstance(bookings, list)
        
        # Step 4: Get availability for current month
        availability_response = session.get(
            f"{BASE_URL}/api/availability/{provider_data['provider_id']}?month=2026-02"
        )
        assert availability_response.status_code == 200
        availability = availability_response.json()
        assert isinstance(availability, list)
    
    def test_client_dashboard_data_flow(self):
        """
        Test complete client dashboard data flow:
        1. Login as client
        2. Get user info via /auth/me
        3. Get bookings
        """
        session = requests.Session()
        
        # Step 1: Login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        assert login_response.status_code == 200
        
        # Step 2: Verify auth/me
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        me_data = me_response.json()
        assert me_data["user_type"] == "client"
        
        # Step 3: Get bookings
        bookings_response = session.get(f"{BASE_URL}/api/bookings?role=client")
        assert bookings_response.status_code == 200
        bookings = bookings_response.json()
        assert isinstance(bookings, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
