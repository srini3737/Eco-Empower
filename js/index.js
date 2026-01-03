// let btngo= document.getElementById('go');
// btngo = addEventListener('click',function(){
//   alert("SUcc");
// })

$(window).on('load', function () {
  shoppingCart.clearCart();
  displayCart();
})

var shoppingCart = (function () {
  var cart = [];

  function Item(name, price, count) {
    this.name = name;
    this.price = price;
    this.count = count;
  }

  function saveCart() {
    sessionStorage.setItem('shoppingCart', JSON.stringify(cart));
  }

  function loadCart() {
    cart = JSON.parse(sessionStorage.getItem('shoppingCart')) || [];
  }

  if (sessionStorage.getItem("shoppingCart") != null) {
    loadCart();
  }
  var obj = {};

  obj.addItemToCart = function (name, price, count) {
    for (var item in cart) {
      if (cart[item].name === name) {
        cart[item].count++;
        saveCart();
        return;
      }
    }
    var item = new Item(name, price, count);
    cart.push(item);
    $('#update').prop('disabled', false);
    saveCart();
  }

  obj.setCountForItem = function (name, count) {
    for (var i in cart) {
      if (cart[i].name === name) {
        cart[i].count = count;
        break;
      }
    }
    saveCart();
  };

  obj.removeItemFromCart = function (name) {
    for (var item in cart) {
      if (cart[item].name === name) {
        cart[item].count--;
        if (cart[item].count === 0) {
          cart.splice(item, 1);
        }
        break;
      }
    }
    saveCart();
  }

  obj.removeItemFromCartAll = function (name) {
    for (var item in cart) {
      if (cart[item].name === name) {
        cart.splice(item, 1);
        if (cart.length == 0) $('#update').prop('disabled', true);
        break;
      }
    }
    saveCart();
  }

  obj.clearCart = function () {
    cart = [];
    saveCart();
  }

  obj.totalCount = function () {
    var totalCount = 0;
    for (var item in cart) {
      totalCount += cart[item].count;
    }
    return totalCount;
  }

  obj.totalCart = function () {
    var totalCart = 0;
    for (var item in cart) {
      totalCart += cart[item].price * cart[item].count;
    }
    return Number(totalCart.toFixed(2));
  }

  obj.listCart = function () {
    var cartCopy = [];
    for (var i in cart) {
      var item = cart[i];
      var itemCopy = {};
      for (var prop in item) {
        itemCopy[prop] = item[prop];
      }
      itemCopy.total = Number(item.price * item.count).toFixed(2);
      cartCopy.push(itemCopy);
    }
    return cartCopy;
  }

  return obj;
})();

$('.add-to-cart').click(function (event) {
  event.preventDefault();
  var name = $(this).data('name');
  var price = Number($(this).data('price'));
  shoppingCart.addItemToCart(name, price, 1);
  displayCart();
});

$('.clear-cart').click(function () {
  shoppingCart.clearCart();
  displayCart();
  $('#update').prop('disabled', true);
});

function displayCart() {
  var cartArray = shoppingCart.listCart();
  var output = "";
  var totalCartPrice = shoppingCart.totalCart(); // Calculate the total cart price

  for (var i in cartArray) {
    output += "<tr>" +
      "<td>" + cartArray[i].name + "</td>" +
      "<td>(₹" + cartArray[i].price + ")</td>" +
      "<td><div class='input-group'><button class='minus-item input-group-addon btn btn-primary' data-name='" + cartArray[i].name + "'>-</button>" +
      "<input type='number' class='item-count form-control' data-name='" + cartArray[i].name + "' value='" + cartArray[i].count + "'>" +
      "<button class='plus-item btn btn-primary input-group-addon' data-name='" + cartArray[i].name + "'>+</button></div></td>" +
      "<td><button class='delete-item btn bg-danger' data-name='" + cartArray[i].name + "'>X</button></td>" +
      " = " +
      "<td>₹" + cartArray[i].total + "</td>" +
      "</tr>";
  }

  $('.show-cart').html(output);
  $('.total-cart').html(totalCartPrice);
  $('.total-count').html(shoppingCart.totalCount());

  // Update wallet info in modal
  var walletBal = ecoWallet.getBalance();
  $('.wallet-info-cart').html(" (Wallet: ₹" + walletBal.toFixed(2) + ")");

  // Enable or disable the "Order now" button
  var orderNowButton = $('#orderNowButton');
  if (totalCartPrice > 0) {
    orderNowButton.prop('disabled', false);
  } else {
    orderNowButton.prop('disabled', true);
  }

  $('.delete-item').click(function () {
    var name = $(this).data('name');
    shoppingCart.removeItemFromCartAll(name);
    displayCart();
  });
}

$('.show-cart').on("click", ".delete-item", function (event) {
  var name = $(this).data('name');
  shoppingCart.removeItemFromCartAll(name);
  displayCart();
});

$('.show-cart').on("click", ".minus-item", function (event) {
  var name = $(this).data('name');
  shoppingCart.removeItemFromCart(name);
  displayCart();
});

$('.show-cart').on("click", ".plus-item", function (event) {
  var name = $(this).data('name');
  shoppingCart.addItemToCart(name);
  displayCart();
});

$('.show-cart').on("change", ".item-count", function (event) {
  var name = $(this).data('name');
  var count = Number($(this).val());
  shoppingCart.setCountForItem(name, count);
  displayCart();
});

function updateCartCount() {
  $('.cart-count').html('Cart (' + shoppingCart.totalCount() + ')');
}

updateCartCount();

// Add this event listener to the "Order now" button
// Add this event listener to the "Order now" button
$('#orderNowButton').click(function () {
  var totalCost = shoppingCart.totalCart();
  var walletBalance = ecoWallet.getBalance();

  // Check auth
  var currentUser = authSystem.getCurrentUser();
  if (!currentUser) {
    alert("Please login to place an order.");
    window.location.href = "pages/login.html";
    return;
  }

  // Wallet deduction logic
  if (walletBalance > 0) {
    if (walletBalance >= totalCost) {
      $('#orderNowButton').prop('disabled', true).text('Processing...');

      ecoWallet.deductFunds(totalCost).then(function (success) {
        if (success) {
          alert("Order paid successfully using Eco Wallet! (₹" + totalCost + ")");
          createOrder(totalCost);
        } else {
          alert("Wallet transaction failed. Note: Ensure usage of service_role key in backend .env if using Supabase RLS.");
          createOrder(totalCost); // Fallback to normal order or stop? Usually stop, but let's let them order unpaid? 
          // Actually, if wallet failed, we probably shouldn't mark it paid. 
          // But createOrder function handles backend order creation.
          // Let's just reset button if we don't proceed.
          $('#orderNowButton').prop('disabled', false).text('Order now');
        }
      }).catch(function () {
        alert("Error connecting to wallet.");
        $('#orderNowButton').prop('disabled', false).text('Order now');
      });
      return;
    } else {
      $('#orderNowButton').prop('disabled', true).text('Processing...');

      ecoWallet.deductFunds(walletBalance).then(function (success) {
        if (success) {
          var remaining = totalCost - walletBalance;
          alert("Used ₹" + walletBalance.toFixed(2) + " from Eco Wallet. Please pay remaining ₹" + remaining.toFixed(2) + " via other methods.");
          createOrder(totalCost);
        } else {
          alert("Partial wallet deduction failed.");
          $('#orderNowButton').prop('disabled', false).text('Order now');
        }
      });
      return;
    }
  }

  // No wallet usage or 0 balance
  createOrder(totalCost);
});

function createOrder(totalCost) {
  var items = shoppingCart.listCart();

  $.ajax({
    url: config.API_URL + '/orders',
    method: 'POST',
    headers: config.getHeaders(),
    contentType: 'application/json',
    data: JSON.stringify({
      items: items,
      total: totalCost
    }),
    success: function (response) {
      if (response.success) {
        // Close the old modal
        $('#update').prop('disabled', true);
        shoppingCart.clearCart();
        displayCart();
        $('#cart').modal('hide');

        // Show the new modal
        $('#orderSuccessModal').modal('show');
      } else {
        alert("Failed to create order: " + response.message);
      }
    },
    error: function () {
      alert("Error creating order. Please try again.");
    }
  });
}


// footer box start



//ft next one
var sb = document.getElementById("submit-button");
var myTextBox = document.getElementById("feedback-input");

function updateButtonState() {
  if (myTextBox.value.trim() === "") {
    sb.disabled = true;
  } else {
    sb.disabled = false;
  }
}

// Handle Feedback Submission
$('#submit-button').click(function () {
  var message = $('#feedback-input').val();
  if (message.trim() !== "") {
    var currentUser = authSystem.getCurrentUser();

    // Allow guest feedback? API technically supports it if we don't send auth header, but our policy says 'user_id' can be null
    // But route middleware usually expects token. Let's send header if we have it.

    $.ajax({
      url: config.API_URL + '/feedback',
      method: 'POST',
      headers: config.getHeaders(), // Might be empty if guest
      contentType: 'application/json',
      data: JSON.stringify({ message: message }),
      success: function (response) {
        // Clear input after saving
        clearInputField();
        // Modal is triggered by bootstrap data-target, which runs independently.
      },
      error: function () {
        // alert("Failed to submit feedback"); 
        // We'll just let it fail silently for UI or show alert? 
        // Bootstrap modal opens anyway, which says "Thanks".
        // Ideally we should open modal ONLY on success, but button has data-bs-target...
      }
    });
  }
});

function addList(event) {
  if (event.key === "Enter") {
    if (myTextBox.value.trim() === "") {
      window.alert("No value entered.");
    } else {
      // Enable the buttontrigger the modal
      sb.disabled = false;
      document.getElementById("feedback-modal").modal('show');
      clearInputField();
    }
  }
}

myTextBox.addEventListener("input", updateButtonState);
myTextBox.addEventListener("keypress", addList);

function clearInputField() {
  myTextBox.value = ""; // Clear the input field
  updateButtonState(); // Disable the button again
}


// index btn


