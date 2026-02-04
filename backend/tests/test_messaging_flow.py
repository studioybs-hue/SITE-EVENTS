"""
Test suite for messaging flow: Client -> Provider contact feature
Tests the flow where a client contacts a provider from the provider card
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_CLIENT_EMAIL = "client@test.com"
TEST_CLIENT_PASSWORD = "password123"
SAMPLE_PROVIDER_ID = "prov_001_photo"
SAMPLE_PROVIDER_USER_ID = "user_sample_001"


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert data["email"] == TEST_CLIENT_EMAIL
        assert data["user_type"] == "client"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_auth_me_without_token(self):
        """Test /auth/me without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestProviderEndpoints:
    """Provider endpoint tests"""
    
    def test_get_providers_list(self):
        """Test GET /api/providers returns list of providers"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify provider structure
        provider = data[0]
        assert "provider_id" in provider
        assert "user_id" in provider
        assert "business_name" in provider
    
    def test_get_provider_by_id(self):
        """Test GET /api/providers/{provider_id} returns provider with user_id"""
        response = requests.get(f"{BASE_URL}/api/providers/{SAMPLE_PROVIDER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["provider_id"] == SAMPLE_PROVIDER_ID
        assert data["user_id"] == SAMPLE_PROVIDER_USER_ID
        assert "business_name" in data
        assert "category" in data
    
    def test_get_provider_not_found(self):
        """Test GET /api/providers/{provider_id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/providers/invalid_provider_id")
        assert response.status_code == 404


class TestUserEndpoints:
    """User endpoint tests - requires authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_get_user_by_id_authenticated(self, auth_session):
        """Test GET /api/users/{user_id} with authentication"""
        response = auth_session.get(f"{BASE_URL}/api/users/{SAMPLE_PROVIDER_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == SAMPLE_PROVIDER_USER_ID
        assert "name" in data
        assert "email" in data
    
    def test_get_user_by_id_unauthenticated(self):
        """Test GET /api/users/{user_id} without authentication"""
        response = requests.get(f"{BASE_URL}/api/users/{SAMPLE_PROVIDER_USER_ID}")
        assert response.status_code == 401
    
    def test_get_user_not_found(self, auth_session):
        """Test GET /api/users/{user_id} with invalid ID"""
        response = auth_session.get(f"{BASE_URL}/api/users/invalid_user_id")
        assert response.status_code == 404


class TestMessagingEndpoints:
    """Messaging endpoint tests - requires authentication"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_send_message_to_provider(self, auth_session):
        """Test POST /api/messages - send message to provider"""
        response = auth_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": SAMPLE_PROVIDER_USER_ID,
            "content": "TEST_Hello, I'm interested in your services for my wedding!"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "message_id" in data
        assert data["receiver_id"] == SAMPLE_PROVIDER_USER_ID
        assert "TEST_" in data["content"]
        assert data["read"] == False
    
    def test_send_message_unauthenticated(self):
        """Test POST /api/messages without authentication"""
        response = requests.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": SAMPLE_PROVIDER_USER_ID,
            "content": "Test message"
        })
        assert response.status_code == 401
    
    def test_get_conversations(self, auth_session):
        """Test GET /api/messages/conversations"""
        response = auth_session.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_messages_with_user(self, auth_session):
        """Test GET /api/messages/{other_user_id}"""
        response = auth_session.get(f"{BASE_URL}/api/messages/{SAMPLE_PROVIDER_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the test message we sent
        if len(data) > 0:
            msg = data[-1]
            assert "message_id" in msg
            assert "content" in msg
            assert "sender_id" in msg


class TestMessagingFlowIntegration:
    """Integration tests for the complete messaging flow"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_complete_contact_provider_flow(self, auth_session):
        """
        Test the complete flow:
        1. Get provider details (to get user_id)
        2. Get user details for the provider
        3. Send a message
        4. Verify message appears in conversation
        """
        # Step 1: Get provider details
        provider_response = auth_session.get(f"{BASE_URL}/api/providers/{SAMPLE_PROVIDER_ID}")
        assert provider_response.status_code == 200
        provider = provider_response.json()
        provider_user_id = provider["user_id"]
        
        # Step 2: Get user details for the provider
        user_response = auth_session.get(f"{BASE_URL}/api/users/{provider_user_id}")
        assert user_response.status_code == 200
        user = user_response.json()
        assert user["user_id"] == provider_user_id
        
        # Step 3: Send a message
        import uuid
        unique_content = f"TEST_Integration test message {uuid.uuid4().hex[:8]}"
        message_response = auth_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": provider_user_id,
            "content": unique_content
        })
        assert message_response.status_code == 200
        sent_message = message_response.json()
        
        # Step 4: Verify message appears in conversation
        messages_response = auth_session.get(f"{BASE_URL}/api/messages/{provider_user_id}")
        assert messages_response.status_code == 200
        messages = messages_response.json()
        
        # Find our message
        found = False
        for msg in messages:
            if msg["content"] == unique_content:
                found = True
                break
        assert found, f"Sent message not found in conversation"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
