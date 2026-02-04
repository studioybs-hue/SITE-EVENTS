"""
Payment API Tests - Stripe Integration
Tests for payment checkout, status, and booking payments endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaymentAPI:
    """Payment endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as client
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@test.com",
            "password": "password123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user = login_response.json()
        
        # Get bookings
        bookings_response = self.session.get(f"{BASE_URL}/api/bookings?role=client")
        assert bookings_response.status_code == 200
        self.bookings = bookings_response.json()
        
        # Find a confirmed booking with pending payment
        self.test_booking = None
        for booking in self.bookings:
            if booking['status'] == 'confirmed' and booking['payment_status'] == 'pending':
                self.test_booking = booking
                break
        
        yield
    
    def test_create_checkout_full_payment(self):
        """Test creating checkout session for full payment"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": self.test_booking['booking_id'],
            "payment_type": "full",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "checkout_url" in data
        assert "session_id" in data
        assert "transaction_id" in data
        assert "amount" in data
        
        # Verify checkout URL is valid Stripe URL
        assert data["checkout_url"].startswith("https://checkout.stripe.com")
        
        # Verify amount equals remaining balance
        expected_amount = self.test_booking['total_amount'] - self.test_booking.get('deposit_paid', 0)
        assert data["amount"] == expected_amount
        
        print(f"✓ Full payment checkout created: {data['amount']}€")
    
    def test_create_checkout_deposit_payment(self):
        """Test creating checkout session for deposit only"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": self.test_booking['booking_id'],
            "payment_type": "deposit",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "checkout_url" in data
        assert "session_id" in data
        assert "amount" in data
        
        # Verify amount is deposit (30% of total)
        deposit_required = self.test_booking.get('deposit_required', self.test_booking['total_amount'] * 0.3)
        deposit_paid = self.test_booking.get('deposit_paid', 0)
        expected_amount = min(deposit_required - deposit_paid, self.test_booking['total_amount'] - deposit_paid)
        assert data["amount"] == expected_amount
        
        print(f"✓ Deposit payment checkout created: {data['amount']}€")
    
    def test_create_checkout_2x_installment(self):
        """Test creating checkout session for 2x installment"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": self.test_booking['booking_id'],
            "payment_type": "installment",
            "installment_number": 1,
            "total_installments": 2,
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "checkout_url" in data
        assert "session_id" in data
        assert "amount" in data
        
        # Verify amount is 50% of remaining
        remaining = self.test_booking['total_amount'] - self.test_booking.get('deposit_paid', 0)
        expected_amount = remaining / 2
        assert data["amount"] == expected_amount
        
        print(f"✓ 2x installment checkout created: {data['amount']}€")
    
    def test_create_checkout_3x_installment(self):
        """Test creating checkout session for 3x installment"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": self.test_booking['booking_id'],
            "payment_type": "installment",
            "installment_number": 1,
            "total_installments": 3,
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "checkout_url" in data
        assert "session_id" in data
        assert "amount" in data
        
        # Verify amount is ~33% of remaining
        remaining = self.test_booking['total_amount'] - self.test_booking.get('deposit_paid', 0)
        expected_amount = round(remaining / 3, 2)
        assert data["amount"] == expected_amount
        
        print(f"✓ 3x installment checkout created: {data['amount']}€")
    
    def test_create_checkout_missing_booking_id(self):
        """Test error when booking_id is missing"""
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "payment_type": "full",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "booking_id" in data.get("detail", "").lower() or "required" in data.get("detail", "").lower()
        
        print("✓ Missing booking_id returns 400")
    
    def test_create_checkout_invalid_booking_id(self):
        """Test error when booking_id is invalid"""
        response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": "invalid_booking_id",
            "payment_type": "full",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data.get("detail", "").lower()
        
        print("✓ Invalid booking_id returns 404")
    
    def test_create_checkout_unauthorized(self):
        """Test error when not authenticated"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        response = unauth_session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": "booking_228f328ea0f3",
            "payment_type": "full",
            "origin_url": BASE_URL
        })
        
        assert response.status_code == 401
        
        print("✓ Unauthorized request returns 401")
    
    def test_get_payment_status(self):
        """Test getting payment status for a session"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        # First create a checkout session
        create_response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "booking_id": self.test_booking['booking_id'],
            "payment_type": "full",
            "origin_url": BASE_URL
        })
        assert create_response.status_code == 200
        session_id = create_response.json()["session_id"]
        
        # Get payment status
        response = self.session.get(f"{BASE_URL}/api/payments/status/{session_id}")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "status" in data
        assert "amount" in data
        assert "booking_id" in data
        
        # Status should be pending (not paid yet)
        assert data["status"] in ["pending", "unpaid"]
        
        print(f"✓ Payment status retrieved: {data['status']}")
    
    def test_get_payment_status_invalid_session(self):
        """Test error when session_id is invalid"""
        response = self.session.get(f"{BASE_URL}/api/payments/status/invalid_session_id")
        
        assert response.status_code == 404
        
        print("✓ Invalid session_id returns 404")
    
    def test_get_booking_payments(self):
        """Test getting all payments for a booking"""
        if not self.test_booking:
            pytest.skip("No confirmed booking with pending payment found")
        
        response = self.session.get(f"{BASE_URL}/api/payments/booking/{self.test_booking['booking_id']}")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        
        # If there are transactions, verify structure
        if len(data) > 0:
            transaction = data[0]
            assert "transaction_id" in transaction
            assert "booking_id" in transaction
            assert "amount" in transaction
            assert "payment_type" in transaction
            assert "payment_status" in transaction
        
        print(f"✓ Booking payments retrieved: {len(data)} transactions")
    
    def test_get_booking_payments_invalid_booking(self):
        """Test error when booking_id is invalid"""
        response = self.session.get(f"{BASE_URL}/api/payments/booking/invalid_booking_id")
        
        assert response.status_code == 404
        
        print("✓ Invalid booking_id returns 404")
    
    def test_get_booking_payments_unauthorized(self):
        """Test error when not authenticated"""
        unauth_session = requests.Session()
        
        response = unauth_session.get(f"{BASE_URL}/api/payments/booking/booking_228f328ea0f3")
        
        assert response.status_code == 401
        
        print("✓ Unauthorized request returns 401")


class TestPaymentAmountCalculations:
    """Test payment amount calculations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as client
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "client@test.com",
            "password": "password123"
        })
        assert login_response.status_code == 200
        
        # Get bookings
        bookings_response = self.session.get(f"{BASE_URL}/api/bookings?role=client")
        assert bookings_response.status_code == 200
        self.bookings = bookings_response.json()
        
        yield
    
    def test_full_payment_amount_correct(self):
        """Verify full payment equals total - deposit_paid"""
        for booking in self.bookings:
            if booking['status'] == 'confirmed' and booking['payment_status'] == 'pending':
                response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
                    "booking_id": booking['booking_id'],
                    "payment_type": "full",
                    "origin_url": BASE_URL
                })
                
                if response.status_code == 200:
                    data = response.json()
                    expected = booking['total_amount'] - booking.get('deposit_paid', 0)
                    assert data['amount'] == expected, f"Expected {expected}, got {data['amount']}"
                    print(f"✓ Full payment amount correct: {data['amount']}€")
                    return
        
        pytest.skip("No suitable booking found")
    
    def test_deposit_amount_is_30_percent(self):
        """Verify deposit is 30% of total"""
        for booking in self.bookings:
            if booking['status'] == 'confirmed' and booking.get('deposit_paid', 0) == 0:
                response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
                    "booking_id": booking['booking_id'],
                    "payment_type": "deposit",
                    "origin_url": BASE_URL
                })
                
                if response.status_code == 200:
                    data = response.json()
                    expected_deposit = booking.get('deposit_required', booking['total_amount'] * 0.3)
                    assert data['amount'] == expected_deposit, f"Expected {expected_deposit}, got {data['amount']}"
                    print(f"✓ Deposit amount correct (30%): {data['amount']}€")
                    return
        
        pytest.skip("No suitable booking found")
    
    def test_2x_installment_is_50_percent(self):
        """Verify 2x installment is 50% of remaining"""
        for booking in self.bookings:
            if booking['status'] == 'confirmed' and booking['payment_status'] == 'pending':
                response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
                    "booking_id": booking['booking_id'],
                    "payment_type": "installment",
                    "installment_number": 1,
                    "total_installments": 2,
                    "origin_url": BASE_URL
                })
                
                if response.status_code == 200:
                    data = response.json()
                    remaining = booking['total_amount'] - booking.get('deposit_paid', 0)
                    expected = remaining / 2
                    assert data['amount'] == expected, f"Expected {expected}, got {data['amount']}"
                    print(f"✓ 2x installment amount correct (50%): {data['amount']}€")
                    return
        
        pytest.skip("No suitable booking found")
    
    def test_3x_installment_is_33_percent(self):
        """Verify 3x installment is ~33% of remaining"""
        for booking in self.bookings:
            if booking['status'] == 'confirmed' and booking['payment_status'] == 'pending':
                response = self.session.post(f"{BASE_URL}/api/payments/create-checkout", json={
                    "booking_id": booking['booking_id'],
                    "payment_type": "installment",
                    "installment_number": 1,
                    "total_installments": 3,
                    "origin_url": BASE_URL
                })
                
                if response.status_code == 200:
                    data = response.json()
                    remaining = booking['total_amount'] - booking.get('deposit_paid', 0)
                    expected = round(remaining / 3, 2)
                    assert data['amount'] == expected, f"Expected {expected}, got {data['amount']}"
                    print(f"✓ 3x installment amount correct (~33%): {data['amount']}€")
                    return
        
        pytest.skip("No suitable booking found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
