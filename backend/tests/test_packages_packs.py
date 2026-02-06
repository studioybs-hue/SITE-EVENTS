"""
Test suite for Packages and Provider Packs endpoints
Tests the bug fixes for:
1. /packages page not displaying multi-provider packages
2. Provider individual packs display
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMultiProviderPackages:
    """Tests for GET /api/packages endpoint - multi-provider event packages"""
    
    def test_get_packages_returns_list(self):
        """GET /api/packages should return a list of packages"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/packages returns {len(data)} packages")
    
    def test_get_packages_contains_expected_packages(self):
        """GET /api/packages should contain the 3 expected packages"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        
        package_names = [p['name'] for p in data]
        expected_packages = [
            "Pack Mariage Complet",
            "Pack Mariage Essentiel", 
            "Pack Anniversaire Premium"
        ]
        
        for expected in expected_packages:
            assert expected in package_names, f"Missing package: {expected}"
            print(f"✓ Found package: {expected}")
    
    def test_package_structure(self):
        """Each package should have required fields"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = [
            'package_id', 'name', 'description', 'event_type',
            'providers', 'original_price', 'discounted_price',
            'discount_percentage', 'services_included', 'is_active'
        ]
        
        for package in data:
            for field in required_fields:
                assert field in package, f"Package {package.get('name', 'unknown')} missing field: {field}"
        
        print(f"✓ All {len(data)} packages have required fields")
    
    def test_package_providers_structure(self):
        """Each package should have providers with required fields"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        data = response.json()
        
        for package in data:
            assert len(package['providers']) > 0, f"Package {package['name']} has no providers"
            
            for provider in package['providers']:
                assert 'provider_id' in provider
                assert 'business_name' in provider
                assert 'category' in provider
        
        print("✓ All packages have valid provider structures")
    
    def test_filter_packages_by_event_type(self):
        """GET /api/packages?event_type=Mariage should filter packages"""
        response = requests.get(f"{BASE_URL}/api/packages?event_type=Mariage")
        assert response.status_code == 200
        data = response.json()
        
        for package in data:
            assert package['event_type'] == 'Mariage', f"Package {package['name']} has wrong event_type"
        
        print(f"✓ Filter by event_type=Mariage returns {len(data)} packages")
    
    def test_get_single_package(self):
        """GET /api/packages/{package_id} should return a single package"""
        response = requests.get(f"{BASE_URL}/api/packages/pkg_mariage_complet")
        assert response.status_code == 200
        data = response.json()
        
        assert data['package_id'] == 'pkg_mariage_complet'
        assert data['name'] == 'Pack Mariage Complet'
        print("✓ GET /api/packages/pkg_mariage_complet returns correct package")


class TestProviderPacks:
    """Tests for GET /api/providers/{provider_id}/packs endpoint - individual provider packs"""
    
    def test_get_provider_packs(self):
        """GET /api/providers/prov_001_photo/packs should return provider's packs"""
        response = requests.get(f"{BASE_URL}/api/providers/prov_001_photo/packs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/providers/prov_001_photo/packs returns {len(data)} packs")
    
    def test_provider_pack_structure(self):
        """Provider pack should have required fields"""
        response = requests.get(f"{BASE_URL}/api/providers/prov_001_photo/packs")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            pack = data[0]
            required_fields = ['pack_id', 'provider_id', 'name', 'price', 'is_active']
            
            for field in required_fields:
                assert field in pack, f"Pack missing field: {field}"
            
            print(f"✓ Pack has all required fields")
    
    def test_provider_pack_photo_mariage_essentiel(self):
        """Provider prov_001_photo should have 'Pack Photo Mariage Essentiel' at 1500€"""
        response = requests.get(f"{BASE_URL}/api/providers/prov_001_photo/packs")
        assert response.status_code == 200
        data = response.json()
        
        pack_names = [p['name'] for p in data]
        assert 'Pack Photo Mariage Essentiel' in pack_names, "Missing 'Pack Photo Mariage Essentiel'"
        
        # Find the specific pack and verify price
        for pack in data:
            if pack['name'] == 'Pack Photo Mariage Essentiel':
                assert pack['price'] == 1500, f"Expected price 1500, got {pack['price']}"
                print(f"✓ Found 'Pack Photo Mariage Essentiel' at {pack['price']}€")
                break
    
    def test_provider_without_packs(self):
        """GET /api/providers/{provider_id}/packs for provider without packs should return empty list"""
        # Test with a provider that might not have packs
        response = requests.get(f"{BASE_URL}/api/providers/prov_002_dj/packs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/providers/prov_002_dj/packs returns {len(data)} packs (may be empty)")


class TestPackagesAccessibility:
    """Tests to verify packages are accessible without authentication"""
    
    def test_packages_no_auth_required(self):
        """GET /api/packages should work without authentication"""
        response = requests.get(f"{BASE_URL}/api/packages")
        assert response.status_code == 200
        print("✓ GET /api/packages works without authentication")
    
    def test_provider_packs_no_auth_required(self):
        """GET /api/providers/{provider_id}/packs should work without authentication"""
        response = requests.get(f"{BASE_URL}/api/providers/prov_001_photo/packs")
        assert response.status_code == 200
        print("✓ GET /api/providers/prov_001_photo/packs works without authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
