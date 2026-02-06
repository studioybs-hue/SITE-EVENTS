"""
Test file for Subscription Plans and Admin Panel APIs
Tests: /api/subscriptions/plans, /api/admin/* endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@lumiere-events.com"
ADMIN_PASSWORD = "Admin2024!"


class TestSubscriptionPlans:
    """Test subscription plans endpoint"""
    
    def test_get_plans_returns_200(self):
        """GET /api/subscriptions/plans returns 200"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert "currency" in data
        print(f"✓ GET /api/subscriptions/plans returns 200 with {len(data['plans'])} plans")
    
    def test_plans_contains_three_plans(self):
        """Plans should contain Gratuit, Pro, Premium"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        data = response.json()
        plans = data["plans"]
        
        assert len(plans) == 3, f"Expected 3 plans, got {len(plans)}"
        
        plan_ids = [p["plan_id"] for p in plans]
        assert "free" in plan_ids, "Missing 'free' plan"
        assert "pro" in plan_ids, "Missing 'pro' plan"
        assert "premium" in plan_ids, "Missing 'premium' plan"
        print("✓ Plans contain free, pro, premium")
    
    def test_free_plan_pricing(self):
        """Free plan should be 0€"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()["plans"]
        
        free_plan = next(p for p in plans if p["plan_id"] == "free")
        assert free_plan["price_monthly"] == 0, f"Free monthly should be 0, got {free_plan['price_monthly']}"
        assert free_plan["price_yearly"] == 0, f"Free yearly should be 0, got {free_plan['price_yearly']}"
        assert free_plan["name"] == "Gratuit"
        print("✓ Free plan: 0€/month, 0€/year")
    
    def test_pro_plan_pricing(self):
        """Pro plan should be 15€/month, 150€/year"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()["plans"]
        
        pro_plan = next(p for p in plans if p["plan_id"] == "pro")
        assert pro_plan["price_monthly"] == 15, f"Pro monthly should be 15, got {pro_plan['price_monthly']}"
        assert pro_plan["price_yearly"] == 150, f"Pro yearly should be 150, got {pro_plan['price_yearly']}"
        assert pro_plan["name"] == "Pro"
        print("✓ Pro plan: 15€/month, 150€/year")
    
    def test_premium_plan_pricing(self):
        """Premium plan should be 19€/month, 190€/year"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()["plans"]
        
        premium_plan = next(p for p in plans if p["plan_id"] == "premium")
        assert premium_plan["price_monthly"] == 19, f"Premium monthly should be 19, got {premium_plan['price_monthly']}"
        assert premium_plan["price_yearly"] == 190, f"Premium yearly should be 190, got {premium_plan['price_yearly']}"
        assert premium_plan["name"] == "Premium"
        print("✓ Premium plan: 19€/month, 190€/year")
    
    def test_plans_have_features(self):
        """Each plan should have features list"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()["plans"]
        
        for plan in plans:
            assert "features" in plan, f"Plan {plan['plan_id']} missing features"
            assert isinstance(plan["features"], list), f"Features should be list"
            assert len(plan["features"]) > 0, f"Plan {plan['plan_id']} has no features"
        print("✓ All plans have features list")


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "admin" in data
        assert data["admin"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['admin']['name']}")
    
    def test_admin_login_invalid_password(self):
        """Admin login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Invalid password returns 401")
    
    def test_admin_login_invalid_email(self):
        """Admin login with wrong email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": "wrong@email.com", "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 401
        print("✓ Invalid email returns 401")


class TestAdminStats:
    """Test admin stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
    
    def test_stats_returns_200(self):
        """GET /api/admin/stats returns 200 with auth"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        print("✓ GET /api/admin/stats returns 200")
    
    def test_stats_contains_required_fields(self):
        """Stats should contain all required fields"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        required_fields = [
            "total_users", "total_providers", "total_clients",
            "total_bookings", "total_revenue", "new_users_this_month",
            "new_bookings_this_month", "revenue_this_month", "active_subscriptions"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print("✓ Stats contains all required fields")
    
    def test_stats_subscription_breakdown(self):
        """Stats should have subscription breakdown by plan"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        data = response.json()
        
        subs = data["active_subscriptions"]
        assert "free" in subs, "Missing free count"
        assert "pro" in subs, "Missing pro count"
        assert "premium" in subs, "Missing premium count"
        print(f"✓ Subscription breakdown: free={subs['free']}, pro={subs['pro']}, premium={subs['premium']}")
    
    def test_stats_without_auth_returns_401(self):
        """Stats without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("✓ Stats without auth returns 401")


class TestAdminUsers:
    """Test admin users management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
    
    def test_get_users_returns_200(self):
        """GET /api/admin/users returns 200"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert "pages" in data
        print(f"✓ GET /api/admin/users returns {data['total']} users")
    
    def test_users_pagination(self):
        """Users endpoint supports pagination"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?page=1&limit=5")
        data = response.json()
        
        assert len(data["users"]) <= 5, "Limit not respected"
        assert data["page"] == 1
        print(f"✓ Pagination works: page {data['page']} of {data['pages']}")
    
    def test_users_search(self):
        """Users endpoint supports search"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?search=test")
        assert response.status_code == 200
        print("✓ Search parameter accepted")
    
    def test_users_type_filter(self):
        """Users endpoint supports user_type filter"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?user_type=provider")
        assert response.status_code == 200
        data = response.json()
        
        for user in data["users"]:
            assert user["user_type"] == "provider", f"Filter not working: got {user['user_type']}"
        print(f"✓ Type filter works: {len(data['users'])} providers")


class TestAdminProviders:
    """Test admin providers management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
    
    def test_get_providers_returns_200(self):
        """GET /api/admin/providers returns 200"""
        response = self.session.get(f"{BASE_URL}/api/admin/providers")
        assert response.status_code == 200
        data = response.json()
        assert "providers" in data
        assert "total" in data
        print(f"✓ GET /api/admin/providers returns {data['total']} providers")
    
    def test_providers_have_subscription_plan(self):
        """Each provider should have subscription_plan field"""
        response = self.session.get(f"{BASE_URL}/api/admin/providers")
        data = response.json()
        
        for provider in data["providers"]:
            assert "subscription_plan" in provider, f"Provider {provider['provider_id']} missing subscription_plan"
        print("✓ All providers have subscription_plan field")
    
    def test_providers_have_verified_field(self):
        """Each provider should have verified field"""
        response = self.session.get(f"{BASE_URL}/api/admin/providers")
        data = response.json()
        
        for provider in data["providers"]:
            assert "verified" in provider, f"Provider {provider['provider_id']} missing verified"
        print("✓ All providers have verified field")


class TestAdminSubscriptions:
    """Test admin subscriptions management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session"""
        self.session = requests.Session()
        response = self.session.post(
            f"{BASE_URL}/api/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
    
    def test_get_subscriptions_returns_200(self):
        """GET /api/admin/subscriptions returns 200"""
        response = self.session.get(f"{BASE_URL}/api/admin/subscriptions")
        assert response.status_code == 200
        data = response.json()
        assert "subscriptions" in data
        assert "total" in data
        print(f"✓ GET /api/admin/subscriptions returns {data['total']} subscriptions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
