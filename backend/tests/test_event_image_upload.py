"""
Test Event Image Upload Feature
Tests the image upload functionality for community events
"""
import pytest
import requests
import os
import base64
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEventImageUpload:
    """Test event image upload functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test provider account"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create a unique test provider
        self.test_email = f"test_provider_{uuid.uuid4().hex[:8]}@test.com"
        self.test_password = "testpass123"
        
        # Register as provider
        register_res = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.test_email,
            "password": self.test_password,
            "name": "Test Provider",
            "user_type": "provider",
            "country": "FR"
        })
        
        if register_res.status_code == 200:
            # Get session token from cookies
            self.session_token = register_res.cookies.get('session_token')
            if self.session_token:
                self.session.cookies.set('session_token', self.session_token)
            print(f"✓ Provider registered: {self.test_email}")
        else:
            # Try login if already exists
            login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.test_email,
                "password": self.test_password
            })
            if login_res.status_code == 200:
                self.session_token = login_res.cookies.get('session_token')
                if self.session_token:
                    self.session.cookies.set('session_token', self.session_token)
                print(f"✓ Provider logged in: {self.test_email}")
            else:
                pytest.skip(f"Could not create/login test provider: {register_res.text}")
        
        # Create provider profile
        profile_res = self.session.post(f"{BASE_URL}/api/providers", json={
            "business_name": "Test Event Provider",
            "category": "DJ / Musique",
            "description": "Test provider for event image upload",
            "location": "Paris",
            "countries": ["FR"],
            "services": ["DJ", "Animation"],
            "pricing_range": "500€ - 2000€"
        })
        
        if profile_res.status_code in [200, 201]:
            print("✓ Provider profile created")
        else:
            print(f"Provider profile creation: {profile_res.status_code} - {profile_res.text[:200]}")
        
        yield
        
        # Cleanup - delete test events
        try:
            events_res = self.session.get(f"{BASE_URL}/api/events/my/events")
            if events_res.status_code == 200:
                events = events_res.json()
                for event in events:
                    self.session.delete(f"{BASE_URL}/api/events/{event['event_id']}")
        except:
            pass
    
    def test_upload_image_endpoint_exists(self):
        """Test that the upload-image endpoint exists"""
        # Create a small test image (1x1 red pixel PNG)
        # This is a minimal valid PNG
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = self.session.post(f"{BASE_URL}/api/events/upload-image", json={
            "image": f"data:image/png;base64,{test_image_base64}"
        })
        
        print(f"Upload response: {response.status_code}")
        print(f"Response body: {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "image_url" in data, "Response should contain image_url"
        assert data["image_url"].startswith("/api/events/images/"), f"image_url should start with /api/events/images/, got: {data['image_url']}"
        
        print(f"✓ Image uploaded successfully: {data['image_url']}")
        
        return data["image_url"]
    
    def test_serve_uploaded_image(self):
        """Test that uploaded images can be served"""
        # First upload an image
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        upload_res = self.session.post(f"{BASE_URL}/api/events/upload-image", json={
            "image": f"data:image/png;base64,{test_image_base64}"
        })
        
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        
        image_url = upload_res.json()["image_url"]
        
        # Now try to fetch the image
        fetch_res = self.session.get(f"{BASE_URL}{image_url}")
        
        print(f"Fetch image response: {fetch_res.status_code}")
        print(f"Content-Type: {fetch_res.headers.get('content-type')}")
        
        assert fetch_res.status_code == 200, f"Expected 200, got {fetch_res.status_code}"
        assert "image" in fetch_res.headers.get('content-type', ''), "Response should be an image"
        
        print(f"✓ Image served successfully from {image_url}")
    
    def test_create_event_with_uploaded_image(self):
        """Test creating an event with an uploaded image"""
        # First upload an image
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        upload_res = self.session.post(f"{BASE_URL}/api/events/upload-image", json={
            "image": f"data:image/png;base64,{test_image_base64}"
        })
        
        assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
        
        image_url = upload_res.json()["image_url"]
        
        # Create event with the uploaded image
        event_data = {
            "title": "Test Event with Image",
            "description": "This is a test event with an uploaded image",
            "event_date": "2026-03-15",
            "event_time": "20:00",
            "location": "Paris",
            "address": "123 Test Street",
            "image_url": image_url,
            "price_info": "Gratuit"
        }
        
        create_res = self.session.post(f"{BASE_URL}/api/events", json=event_data)
        
        print(f"Create event response: {create_res.status_code}")
        print(f"Response body: {create_res.text[:500]}")
        
        assert create_res.status_code == 200, f"Expected 200, got {create_res.status_code}: {create_res.text}"
        
        event = create_res.json()
        assert event["image_url"] == image_url, f"Event image_url should match uploaded image"
        
        print(f"✓ Event created with uploaded image: {event['event_id']}")
        
        # Verify event appears in list
        events_res = self.session.get(f"{BASE_URL}/api/events?upcoming_only=false")
        assert events_res.status_code == 200
        
        events = events_res.json()["events"]
        created_event = next((e for e in events if e["event_id"] == event["event_id"]), None)
        
        assert created_event is not None, "Created event should appear in events list"
        assert created_event["image_url"] == image_url, "Event in list should have correct image_url"
        
        print(f"✓ Event with image appears in events list")
        
        return event["event_id"]
    
    def test_upload_image_requires_auth(self):
        """Test that image upload requires authentication"""
        # Create a new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = unauth_session.post(f"{BASE_URL}/api/events/upload-image", json={
            "image": f"data:image/png;base64,{test_image_base64}"
        })
        
        print(f"Unauthenticated upload response: {response.status_code}")
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        
        print("✓ Image upload correctly requires authentication")
    
    def test_upload_image_requires_provider(self):
        """Test that image upload requires provider user type"""
        # Create a client user
        client_session = requests.Session()
        client_session.headers.update({"Content-Type": "application/json"})
        
        client_email = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
        
        register_res = client_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": client_email,
            "password": "testpass123",
            "name": "Test Client",
            "user_type": "client",
            "country": "FR"
        })
        
        if register_res.status_code == 200:
            session_token = register_res.cookies.get('session_token')
            if session_token:
                client_session.cookies.set('session_token', session_token)
        else:
            pytest.skip("Could not create test client")
        
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
        
        response = client_session.post(f"{BASE_URL}/api/events/upload-image", json={
            "image": f"data:image/png;base64,{test_image_base64}"
        })
        
        print(f"Client upload response: {response.status_code}")
        
        assert response.status_code == 403, f"Expected 403 for client user, got {response.status_code}"
        
        print("✓ Image upload correctly requires provider user type")
    
    def test_upload_image_without_data(self):
        """Test that upload fails without image data"""
        response = self.session.post(f"{BASE_URL}/api/events/upload-image", json={})
        
        print(f"Empty upload response: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for empty request, got {response.status_code}"
        
        print("✓ Upload correctly fails without image data")
    
    def test_get_nonexistent_image(self):
        """Test that getting a nonexistent image returns 404"""
        response = self.session.get(f"{BASE_URL}/api/events/images/nonexistent-image.jpg")
        
        print(f"Nonexistent image response: {response.status_code}")
        
        assert response.status_code == 404, f"Expected 404 for nonexistent image, got {response.status_code}"
        
        print("✓ Nonexistent image correctly returns 404")
    
    def test_my_events_endpoint(self):
        """Test the my/events endpoint for providers"""
        response = self.session.get(f"{BASE_URL}/api/events/my/events")
        
        print(f"My events response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        events = response.json()
        assert isinstance(events, list), "Response should be a list"
        
        print(f"✓ My events endpoint works, found {len(events)} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
