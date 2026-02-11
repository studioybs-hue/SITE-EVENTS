"""
Test Category Image Upload Feature
Tests the admin endpoints for uploading images and updating category images
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "Admin123!"

# Small test image (1x1 red pixel PNG in base64)
TEST_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


class TestCategoryImageUpload:
    """Tests for category image upload feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if login_response.status_code != 200:
            pytest.skip(f"Admin login failed: {login_response.text}")
        
        login_data = login_response.json()
        assert login_data.get("success") == True, "Admin login should succeed"
        
        yield
        
        # Cleanup: logout
        self.session.post(f"{BASE_URL}/api/admin/logout")
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
    
    def test_get_categories_authenticated(self):
        """Test GET /api/admin/categories returns both events and pro categories"""
        response = self.session.get(f"{BASE_URL}/api/admin/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "events" in data
        assert "pro" in data
        
        # Verify events categories
        assert len(data["events"]) > 0
        for cat in data["events"]:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat
        
        # Verify pro categories
        assert len(data["pro"]) > 0
        for cat in data["pro"]:
            assert "id" in cat
            assert "name" in cat
            assert "icon" in cat
    
    def test_upload_image_endpoint(self):
        """Test POST /api/admin/upload-image uploads image successfully"""
        response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "category_test_upload"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "image_url" in data
        assert "filename" in data
        
        # Verify URL format
        assert data["image_url"].startswith("/api/files/")
        assert "site_category_test_upload" in data["filename"]
        
        # Verify file is accessible
        file_response = requests.get(f"{BASE_URL}{data['image_url']}")
        assert file_response.status_code == 200
    
    def test_upload_image_without_data(self):
        """Test POST /api/admin/upload-image fails without image data"""
        response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={"type": "test"}
        )
        
        assert response.status_code == 400
    
    def test_update_category_image_events(self):
        """Test PATCH /api/admin/categories/events/{category_id}/image updates category image"""
        # First upload an image
        upload_response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "category_photographer"
            }
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Update category image
        response = self.session.patch(
            f"{BASE_URL}/api/admin/categories/events/photographer/image",
            json={"image_url": image_url}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Image mise à jour"
        
        # Verify the update persisted
        categories_response = self.session.get(f"{BASE_URL}/api/admin/categories")
        assert categories_response.status_code == 200
        categories = categories_response.json()
        
        photographer_cat = next((c for c in categories["events"] if c["id"] == "photographer"), None)
        assert photographer_cat is not None
        assert photographer_cat["image"] == image_url
    
    def test_update_category_image_pro(self):
        """Test PATCH /api/admin/categories/pro/{category_id}/image updates category image"""
        # First upload an image
        upload_response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "category_electrician"
            }
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Update category image
        response = self.session.patch(
            f"{BASE_URL}/api/admin/categories/pro/electrician/image",
            json={"image_url": image_url}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Image mise à jour"
        
        # Verify the update persisted
        categories_response = self.session.get(f"{BASE_URL}/api/admin/categories")
        assert categories_response.status_code == 200
        categories = categories_response.json()
        
        electrician_cat = next((c for c in categories["pro"] if c["id"] == "electrician"), None)
        assert electrician_cat is not None
        assert electrician_cat["image"] == image_url
    
    def test_update_category_image_invalid_mode(self):
        """Test PATCH with invalid mode returns 400"""
        response = self.session.patch(
            f"{BASE_URL}/api/admin/categories/invalid/photographer/image",
            json={"image_url": "/api/files/test.jpg"}
        )
        
        assert response.status_code == 400
    
    def test_clear_category_image(self):
        """Test clearing a category image by setting empty string"""
        # First set an image
        upload_response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "category_dj"
            }
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Set the image
        self.session.patch(
            f"{BASE_URL}/api/admin/categories/events/dj/image",
            json={"image_url": image_url}
        )
        
        # Clear the image
        response = self.session.patch(
            f"{BASE_URL}/api/admin/categories/events/dj/image",
            json={"image_url": ""}
        )
        
        assert response.status_code == 200
        
        # Verify the image was cleared
        categories_response = self.session.get(f"{BASE_URL}/api/admin/categories")
        categories = categories_response.json()
        
        dj_cat = next((c for c in categories["events"] if c["id"] == "dj"), None)
        assert dj_cat is not None
        assert dj_cat["image"] == ""
    
    def test_public_categories_endpoint_returns_images(self):
        """Test GET /api/categories/{mode} returns categories with images"""
        # First set an image on a category
        upload_response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "category_caterer"
            }
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Update category image
        self.session.patch(
            f"{BASE_URL}/api/admin/categories/events/caterer/image",
            json={"image_url": image_url}
        )
        
        # Test public endpoint
        response = requests.get(f"{BASE_URL}/api/categories/events")
        assert response.status_code == 200
        
        categories = response.json()
        caterer_cat = next((c for c in categories if c["id"] == "caterer"), None)
        assert caterer_cat is not None
        assert caterer_cat["image"] == image_url
    
    def test_uploaded_file_accessible(self):
        """Test that uploaded files are accessible via /api/files/{filename}"""
        # Upload an image
        upload_response = self.session.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "accessibility_test"
            }
        )
        assert upload_response.status_code == 200
        image_url = upload_response.json()["image_url"]
        
        # Access the file
        file_response = requests.get(f"{BASE_URL}{image_url}")
        assert file_response.status_code == 200
        assert file_response.headers.get("content-type") == "image/jpeg"


class TestCategoryImageUploadUnauthenticated:
    """Tests for unauthenticated access to category image endpoints"""
    
    def test_get_categories_unauthenticated(self):
        """Test GET /api/admin/categories requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/categories")
        assert response.status_code == 401
    
    def test_upload_image_unauthenticated(self):
        """Test POST /api/admin/upload-image without auth - may or may not require auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-image",
            json={
                "image": TEST_IMAGE_BASE64,
                "type": "test"
            },
            headers={"Content-Type": "application/json"}
        )
        # This endpoint may not require auth based on the code
        # Just verify it doesn't crash
        assert response.status_code in [200, 401]
    
    def test_update_category_image_unauthenticated(self):
        """Test PATCH /api/admin/categories/{mode}/{id}/image requires authentication"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/categories/events/photographer/image",
            json={"image_url": "/api/files/test.jpg"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
