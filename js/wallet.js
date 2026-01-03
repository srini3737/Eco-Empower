var ecoWallet = (function () {
    var balance = 0;

    function loadBalance() {
        var user = authSystem.getCurrentUser();
        if (!user) {
            balance = 0;
            updateModalBalance();
            return;
        }

        $.ajax({
            url: config.API_URL + '/wallet/balance/' + user.id,
            method: 'GET',
            headers: config.getHeaders(),
            success: function (response) {
                if (response.success) {
                    balance = parseFloat(response.balance);
                    updateModalBalance();
                }
            }
        });
    }

    // Modal HTML injection
    function injectModal() {
        if ($('#walletModal').length === 0) {
            var modalHtml = `
            <div class="modal fade" id="walletModal" tabindex="-1" aria-labelledby="walletModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border-radius: 15px; overflow: hidden;">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title" id="walletModalLabel"><i class="fas fa-wallet me-2"></i>My Eco Wallet</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center p-4">
                            <p class="text-muted mb-1">Current Balance</p>
                            <h1 class="display-4 fw-bold text-success mb-4" id="walletModalBalance">₹0.00</h1>
                            
                             <div class="d-grid gap-2">
                                <button id="btnAddFunds" class="btn btn-outline-success btn-sm mb-2">
                                    <i class="fas fa-plus me-1"></i>Add ₹500 (Demo)
                                </button>
                                <button id="btnBuyItems" class="btn btn-success btn-lg" style="border-radius: 25px;">
                                    <i class="fas fa-shopping-cart me-2"></i>Buy Items
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            $('body').append(modalHtml);
        }
    }

    function updateModalBalance() {
        $('#walletModalBalance').text("₹" + balance.toFixed(2));
        // Also update cart wallet info if present
        if ($('.wallet-info-cart').length > 0) {
            $('.wallet-info-cart').html(" (Wallet: ₹" + balance.toFixed(2) + ")");
        }
    }

    function setupEventListeners() {
        // Navbar link click
        $(document).on('click', '#wallet-nav-link', function (e) {
            e.preventDefault();
            var user = authSystem.getCurrentUser();
            if (!user) {
                alert("Please login to view your wallet");
                return;
            }
            loadBalance(); // Refresh balance
            $('#walletModal').modal('show');
        });

        // Add Funds (Demo)
        $(document).on('click', '#btnAddFunds', function () {
            var user = authSystem.getCurrentUser();
            if (!user) return;

            $.ajax({
                url: config.API_URL + '/wallet/add',
                method: 'POST',
                contentType: 'application/json',
                headers: config.getHeaders(),
                data: JSON.stringify({ amount: 500 }),
                success: function (response) {
                    if (response.success) {
                        balance = parseFloat(response.balance);
                        updateModalBalance();
                        alert("Added ₹500 to wallet successfully!");
                    }
                }
            });
        });

        // Buy Items click
        $(document).on('click', '#btnBuyItems', function () {
            var currentPath = window.location.pathname;
            // Simple check
            if (currentPath.indexOf('/pages/') === -1 && currentPath.indexOf('item.html') === -1) {
                window.location.href = 'pages/item.html';
            } else if (currentPath.indexOf('/pages/') !== -1 && currentPath.indexOf('item.html') === -1) {
                window.location.href = 'item.html';
            }
            $('#walletModal').modal('hide');
        });
    }

    // Initialize
    // Wait for DOM
    $(document).ready(function () {
        injectModal();
        setupEventListeners();
        // Delay load to allow auth to finish
        setTimeout(loadBalance, 500);
    });

    return {
        getBalance: function () {
            return balance;
        },
        // Returns promise now
        deductFunds: function (amount) {
            return $.ajax({
                url: config.API_URL + '/wallet/deduct',
                method: 'POST',
                contentType: 'application/json',
                headers: config.getHeaders(),
                data: JSON.stringify({ amount: amount })
            }).then(function (response) {
                if (response.success) {
                    balance = parseFloat(response.balance);
                    updateModalBalance();
                    return true;
                }
                return false;
            }).catch(function (err) {
                console.error("Wallet deduction error:", err);
                return false;
            });
        },
        reload: function () {
            loadBalance();
        }
    };
})();
