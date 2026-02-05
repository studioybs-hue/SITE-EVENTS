"""
Test Portfolio and Reviews API endpoints
Tests for new features:
- Portfolio (Stories) system: GET/POST/PATCH/DELETE
- Reviews system with verified badge
- Countries display on provider card
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
PROVIDER_EMAIL = "provider@test.com"
PROVIDER_PASSWORD = "password123"
CLIENT_EMAIL = "client@test.com"
CLIENT_PASSWORD = "password123"


class TestPortfolioEndpoints:
    """Test Portfolio (Stories) API endpoints"""
    
    provider_session = None
    provider_id = None
    created_item_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as provider and get provider_id"""
        # Login as provider
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": PROVIDER_EMAIL,
            "password": PROVIDER_PASSWORD
        })
        if response.status_code == 200:
            cls.provider_session = requests.Session()
            cls.provider_session.cookies.update(response.cookies)
            
            # Get provider profile
            me_response = cls.provider_session.get(f"{BASE_URL}/api/auth/me")
            if me_response.status_code == 200:
                user_data = me_response.json()
                profile_response = cls.provider_session.get(f"{BASE_URL}/api/providers/user/{user_data['user_id']}")
                if profile_response.status_code == 200:
                    cls.provider_id = profile_response.json()['provider_id']
    
    def test_01_get_portfolio_provider_empty(self):
        """GET /api/portfolio/provider/{provider_id} - Get portfolio items for a provider"""
        if not self.provider_id:
            pytest.skip("Provider ID not available")
        
        response = requests.get(f"{BASE_URL}/api/portfolio/provider/{self.provider_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Portfolio items count: {len(data)}")
    
    def test_02_create_portfolio_item_photo(self):
        """POST /api/portfolio - Create a new photo portfolio item"""
        if not self.provider_session:
            pytest.skip("Provider session not available")
        
        payload = {
            "media_type": "photo",
            "media_url": "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800",
            "title": "TEST_Mariage Sophie & Pierre",
            "description": "Magnifique mariage au Château de Versailles",
            "event_type": "wedding"
        }
        
        response = self.provider_session.post(f"{BASE_URL}/api/portfolio", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "item_id" in data
        TestPortfolioEndpoints.created_item_id = data["item_id"]
        print(f"Created portfolio item: {data['item_id']}")
    
    def test_03_create_portfolio_item_youtube(self):
        """POST /api/portfolio - Create a YouTube portfolio item"""
        if not self.provider_session:
            pytest.skip("Provider session not available")
        
        payload = {
            "media_type": "youtube",
            "media_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "thumbnail_url": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            "title": "TEST_Vidéo Mariage",
            "description": "Film de mariage complet",
            "event_type": "wedding"
        }
        
        response = self.provider_session.post(f"{BASE_URL}/api/portfolio", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "item_id" in data
        print(f"Created YouTube portfolio item: {data['item_id']}")
    
    def test_04_get_my_portfolio_items(self):
        """GET /api/portfolio/my-items - Get current provider's portfolio items"""
        if not self.provider_session:
            pytest.skip("Provider session not available")
        
        response = self.provider_session.get(f"{BASE_URL}/api/portfolio/my-items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least the 2 items we created
        
        # Verify item structure
        for item in data:
            assert "item_id" in item
            assert "media_type" in item
            assert "media_url" in item
            assert "views_count" in item
        
        print(f"My portfolio items: {len(data)}")
    
    def test_05_get_portfolio_provider_with_items(self):
        """GET /api/portfolio/provider/{provider_id} - Verify items are visible"""
        if not self.provider_id:
            pytest.skip("Provider ID not available")
        
        response = requests.get(f"{BASE_URL}/api/portfolio/provider/{self.provider_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        print(f"Public portfolio items: {len(data)}")
    
    def test_06_update_portfolio_item(self):
        """PATCH /api/portfolio/{item_id} - Update a portfolio item"""
        if not self.provider_session or not self.created_item_id:
            pytest.skip("Provider session or item ID not available")
        
        payload = {
            "title": "TEST_Updated Title",
            "description": "Updated description for testing"
        }
        
        response = self.provider_session.patch(
            f"{BASE_URL}/api/portfolio/{self.created_item_id}", 
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Updated portfolio item: {self.created_item_id}")
    
    def test_07_increment_view_count(self):
        """POST /api/portfolio/{item_id}/view - Increment view count"""
        if not self.created_item_id:
            pytest.skip("Item ID not available")
        
        response = requests.post(f"{BASE_URL}/api/portfolio/{self.created_item_id}/view")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Incremented view count for: {self.created_item_id}")
    
    def test_08_delete_portfolio_item(self):
        """DELETE /api/portfolio/{item_id} - Delete a portfolio item"""
        if not self.provider_session or not self.created_item_id:
            pytest.skip("Provider session or item ID not available")
        
        response = self.provider_session.delete(f"{BASE_URL}/api/portfolio/{self.created_item_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted portfolio item: {self.created_item_id}")


class TestReviewsEndpoints:
    """Test Reviews API endpoints with verified badge"""
    
    client_session = None
    provider_id = None
    created_review_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as client"""
        # Login as client
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASSWORD
        })
        if response.status_code == 200:
            cls.client_session = requests.Session()
            cls.client_session.cookies.update(response.cookies)
        
        # Get a provider ID for testing
        providers_response = requests.get(f"{BASE_URL}/api/providers")
        if providers_response.status_code == 200:
            providers = providers_response.json()
            if providers:
                cls.provider_id = providers[0]['provider_id']
    
    def test_01_get_provider_reviews(self):
        """GET /api/reviews/provider/{provider_id} - Get reviews with stats"""
        if not self.provider_id:
            pytest.skip("Provider ID not available")
        
        response = requests.get(f"{BASE_URL}/api/reviews/provider/{self.provider_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "reviews" in data
        assert "total" in data
        assert "verified_count" in data
        assert "average_rating" in data
        
        assert isinstance(data["reviews"], list)
        assert isinstance(data["total"], int)
        assert isinstance(data["verified_count"], int)
        
        print(f"Reviews: {data['total']}, Verified: {data['verified_count']}, Avg: {data['average_rating']}")
    
    def test_02_can_review_provider(self):
        """GET /api/reviews/can-review/{provider_id} - Check if user can leave review"""
        if not self.client_session or not self.provider_id:
            pytest.skip("Client session or provider ID not available")
        
        response = self.client_session.get(f"{BASE_URL}/api/reviews/can-review/{self.provider_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "can_leave_verified_review" in data
        assert "eligible_bookings" in data
        assert "can_leave_unverified_review" in data
        
        print(f"Can leave verified: {data['can_leave_verified_review']}, Eligible bookings: {len(data['eligible_bookings'])}")
    
    def test_03_create_unverified_review(self):
        """POST /api/reviews - Create an unverified review"""
        if not self.client_session or not self.provider_id:
            pytest.skip("Client session or provider ID not available")
        
        payload = {
            "provider_id": self.provider_id,
            "rating": 5,
            "comment": "TEST_Excellent prestataire, très professionnel et à l'écoute!"
        }
        
        response = self.client_session.post(f"{BASE_URL}/api/reviews", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "review_id" in data
        assert "is_verified" in data
        # Unverified review since no booking_id provided
        assert data["is_verified"] == False
        
        TestReviewsEndpoints.created_review_id = data["review_id"]
        print(f"Created unverified review: {data['review_id']}")
    
    def test_04_verify_review_in_list(self):
        """Verify the created review appears in provider reviews"""
        if not self.provider_id:
            pytest.skip("Provider ID not available")
        
        response = requests.get(f"{BASE_URL}/api/reviews/provider/{self.provider_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Find our test review
        test_reviews = [r for r in data["reviews"] if "TEST_" in r.get("comment", "")]
        assert len(test_reviews) > 0
        
        review = test_reviews[0]
        assert review["rating"] == 5
        assert review["is_verified"] == False
        assert "client_name" in review
        
        print(f"Found test review with rating: {review['rating']}")
    
    def test_05_invalid_rating(self):
        """POST /api/reviews - Test invalid rating validation"""
        if not self.client_session or not self.provider_id:
            pytest.skip("Client session or provider ID not available")
        
        payload = {
            "provider_id": self.provider_id,
            "rating": 10,  # Invalid - should be 1-5
            "comment": "TEST_Invalid rating test"
        }
        
        response = self.client_session.post(f"{BASE_URL}/api/reviews", json=payload)
        assert response.status_code == 400
        print("Invalid rating correctly rejected")


class TestProviderCountries:
    """Test provider countries display"""
    
    def test_01_provider_has_countries(self):
        """GET /api/providers - Verify providers have countries field"""
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        providers = response.json()
        
        assert len(providers) > 0
        
        # Check that providers have countries field
        for provider in providers:
            assert "countries" in provider
            assert isinstance(provider["countries"], list)
            assert len(provider["countries"]) > 0
        
        # Find a provider with multiple countries
        multi_country_providers = [p for p in providers if len(p["countries"]) > 1]
        if multi_country_providers:
            print(f"Provider with multiple countries: {multi_country_providers[0]['business_name']} - {multi_country_providers[0]['countries']}")
        else:
            print("All providers have single country")
    
    def test_02_provider_detail_has_countries(self):
        """GET /api/providers/{provider_id} - Verify single provider has countries"""
        # Get first provider
        response = requests.get(f"{BASE_URL}/api/providers")
        assert response.status_code == 200
        providers = response.json()
        
        if not providers:
            pytest.skip("No providers available")
        
        provider_id = providers[0]["provider_id"]
        
        # Get provider detail
        detail_response = requests.get(f"{BASE_URL}/api/providers/{provider_id}")
        assert detail_response.status_code == 200
        provider = detail_response.json()
        
        assert "countries" in provider
        assert isinstance(provider["countries"], list)
        print(f"Provider {provider['business_name']} countries: {provider['countries']}")


class TestAuthenticationRequired:
    """Test that protected endpoints require authentication"""
    
    def test_01_portfolio_create_requires_auth(self):
        """POST /api/portfolio - Should require authentication"""
        payload = {
            "media_type": "photo",
            "media_url": "https://example.com/image.jpg",
            "title": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/portfolio", json=payload)
        assert response.status_code == 401
        print("Portfolio create correctly requires auth")
    
    def test_02_portfolio_my_items_requires_auth(self):
        """GET /api/portfolio/my-items - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/portfolio/my-items")
        assert response.status_code == 401
        print("Portfolio my-items correctly requires auth")
    
    def test_03_reviews_create_requires_auth(self):
        """POST /api/reviews - Should require authentication"""
        payload = {
            "provider_id": "test",
            "rating": 5,
            "comment": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/reviews", json=payload)
        assert response.status_code == 401
        print("Reviews create correctly requires auth")
    
    def test_04_can_review_requires_auth(self):
        """GET /api/reviews/can-review/{provider_id} - Should require authentication"""
        response = requests.get(f"{BASE_URL}/api/reviews/can-review/test_provider")
        assert response.status_code == 401
        print("Can-review correctly requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
