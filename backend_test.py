#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class LumiereEventsAPITester:
    def __init__(self, base_url="https://eventwiz.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.provider_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return {}

    def create_test_user_session(self):
        """Create test user and session directly in database for testing"""
        print("\n🔧 Setting up test user and session...")
        
        # Generate test data
        timestamp = int(datetime.now().timestamp())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # For now, we'll use a mock session token and test without auth
        # In a real scenario, we'd create the user via MongoDB
        print(f"📝 Test User ID: {self.user_id}")
        print(f"🔑 Test Session Token: {self.session_token}")
        
        return True

    def test_health_check(self):
        """Test basic connectivity"""
        print("\n🏥 Testing basic connectivity...")
        try:
            response = requests.get(f"{self.base_url}/api/providers", timeout=10)
            success = response.status_code in [200, 401]  # 401 is ok for unauth request
            self.log_test("Basic connectivity", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Basic connectivity", False, f"Error: {str(e)}")
            return False

    def test_providers_endpoints(self):
        """Test provider-related endpoints"""
        print("\n👥 Testing Provider Endpoints...")
        
        # Test get providers (public endpoint)
        self.run_test("Get providers", "GET", "providers", 200)
        
        # Test get providers with filters
        self.run_test("Get providers with category filter", "GET", "providers?category=DJ", 200)
        self.run_test("Get providers with location filter", "GET", "providers?location=Paris", 200)
        self.run_test("Get providers with search", "GET", "providers?search=photo", 200)

    def test_marketplace_endpoints(self):
        """Test marketplace endpoints"""
        print("\n🛒 Testing Marketplace Endpoints...")
        
        # Test get marketplace items (public endpoint)
        self.run_test("Get marketplace items", "GET", "marketplace", 200)
        
        # Test with filters
        self.run_test("Get marketplace with category filter", "GET", "marketplace?category=Audio", 200)
        self.run_test("Get marketplace with location filter", "GET", "marketplace?location=Paris", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Auth Endpoints...")
        
        # Test /me endpoint without auth (should fail)
        self.run_test("Get user info (no auth)", "GET", "auth/me", 401)
        
        # Test session creation with invalid session_id
        invalid_session_data = {"session_id": "invalid_session_123"}
        self.run_test("Create session (invalid)", "POST", "auth/session", 401, invalid_session_data)

    def test_protected_endpoints_without_auth(self):
        """Test protected endpoints without authentication"""
        print("\n🔒 Testing Protected Endpoints (No Auth)...")
        
        # These should all return 401
        self.run_test("Get bookings (no auth)", "GET", "bookings", 401)
        self.run_test("Get conversations (no auth)", "GET", "messages/conversations", 401)
        self.run_test("Create provider profile (no auth)", "POST", "providers", 401, {
            "business_name": "Test Business",
            "category": "DJ",
            "description": "Test description",
            "location": "Paris",
            "services": ["Music", "Sound"],
            "pricing_range": "€500-€1000"
        })

    def test_database_connectivity(self):
        """Test if backend can connect to database"""
        print("\n💾 Testing Database Connectivity...")
        
        # Try to get providers - if this works, DB connection is likely OK
        try:
            response = requests.get(f"{self.base_url}/api/providers", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Database connectivity", True, f"Retrieved {len(data)} providers")
            else:
                self.log_test("Database connectivity", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Database connectivity", False, f"Error: {str(e)}")

    def test_cors_headers(self):
        """Test CORS configuration"""
        print("\n🌐 Testing CORS Headers...")
        
        try:
            response = requests.options(f"{self.base_url}/api/providers", 
                                      headers={'Origin': 'https://eventwiz.preview.emergentagent.com'})
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            has_cors = any(header in response.headers for header in cors_headers)
            self.log_test("CORS headers present", has_cors, f"Headers: {list(response.headers.keys())}")
            
        except Exception as e:
            self.log_test("CORS headers", False, f"Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Lumière Events Backend API Tests")
        print(f"🎯 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic tests
        if not self.test_health_check():
            print("❌ Basic connectivity failed. Stopping tests.")
            return False

        # Database connectivity
        self.test_database_connectivity()
        
        # CORS tests
        self.test_cors_headers()
        
        # Public endpoint tests
        self.test_providers_endpoints()
        self.test_marketplace_endpoints()
        
        # Auth tests
        self.test_auth_endpoints()
        self.test_protected_endpoints_without_auth()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def get_test_results(self):
        """Return detailed test results"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "details": self.test_results
        }

def main():
    """Main test execution"""
    tester = LumiereEventsAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save results to file
        results = tester.get_test_results()
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())