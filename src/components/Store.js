import React, { Component } from "react";
import Header from "./Header";
import Products from "./Products";
import Footer from "./Footer";
import QuickView from "./QuickView";

class Store extends Component {
  constructor() {
    super();
    this.state = {
      products: [],
      cart: [],
      cartRaw: [],
      ord: [],
      totalItems: 0,
      totalAmount: 0,
      term: "",
      category: "",
      cartBounce: false,
      quantity: 1,
      quickViewProduct: {},
      modalActive: false
    };
    this.handleSearch = this.handleSearch.bind(this);
    this.handleMobileSearch = this.handleMobileSearch.bind(this);
    this.handleAddToCart = this.handleAddToCart.bind(this);
    this.sumTotalItems = this.sumTotalItems.bind(this);
    this.sumTotalAmount = this.sumTotalAmount.bind(this);
    this.checkProduct = this.checkProduct.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
    this.handleRemoveProduct = this.handleRemoveProduct.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleTermChange = this.handleTermChange.bind(this);
    this.handleHomeSet = this.handleHomeSet.bind(this);
    this.handleAction = this.handleAction.bind(this);
  }
  // Fetch Initial Set of Products from external API
  getProducts() {
    fetch("http://localhost:3010/food")
      .then(response => response.json())
      .then(response => this.setState({ products: response.data }))
      .catch(err => console.error(err));
  }
  getCart() {
    fetch("http://localhost:3010/cart?no=" + this.props.number)
      .then(response => response.json())
      .then(response => {
        if (
          JSON.stringify(this.state.cartRaw) != JSON.stringify(response.data)
        ) {
          this.setState({ cart: [] }),
            response.data.forEach(dat => {
              this.handleAddToCart(dat, false);
            }),
            this.setState({ cartRaw: response.data });
        }
      })
      .catch(err => console.error(err));
  }
  getOrder() {
    fetch("http://localhost:3010/ord?no=" + this.props.number)
      .then(response => response.json())
      .then(response => {
        if (JSON.stringify(this.state.ord) != JSON.stringify(response.data)) {
          this.setState({ ord: response.data });
        }
      })
      .catch(err => console.error(err));
  }

  geoFindMe() {
    var output = document.getElementById("out");

    if (!navigator.geolocation) {
      output.innerHTML = "<p>Geolocation is not supported by your browser</p>";
      return;
    }

    function success(position) {
      var latitude = position.coords.latitude;
      var longitude = position.coords.longitude;

      output.innerHTML =
        "<p>Latitude is " +
        latitude +
        "° <br>Longitude is " +
        longitude +
        "°</p>";

      var img = new Image();
      img.src =
        "https://maps.googleapis.com/maps/api/staticmap?center=" +
        latitude +
        "," +
        longitude +
        "&zoom=13&size=300x300&sensor=false";

      output.appendChild(img);
    }

    function error() {
      output.innerHTML = "Unable to retrieve your location";
    }

    output.innerHTML = "<p>Locating…</p>";

    navigator.geolocation.getCurrentPosition(success, error);
  }

  componentWillMount() {
    this.getProducts();
  }
  componentDidUpdate() {
    this.getCart();
    this.getOrder();
  }
  // Search by Keyword
  handleSearch(event) {
    this.setState({ term: event.target.value });
  }
  // Mobile Search Reset
  handleMobileSearch() {
    this.setState({ term: "" });
  }
  // Filter by Category
  handleCategory(event) {
    this.setState({ category: event.target.value });
  }
  // Add to Cart
  handleAddToCart(selectedProducts, isdb) {
    let cartItem = this.state.cart;
    let productID = selectedProducts.id;
    let productQty = selectedProducts.quantity;
    if (isdb) {
      fetch(
        "http://localhost:3010/cart/add?no=" +
          this.props.number +
          '&food="' +
          productID +
          '"&num=' +
          Number(productQty)
      ).catch(err => console.error(err));
    }
    if (this.checkProduct(productID)) {
      let index = cartItem.findIndex(x => x.id == productID);
      cartItem[index].quantity = isdb
        ? Number(cartItem[index].quantity) + Number(productQty)
        : Number(productQty);
      this.setState({
        cart: cartItem
      });
    } else {
      cartItem.push(selectedProducts);
    }
    this.setState({
      cart: cartItem,
      cartBounce: true
    });
    setTimeout(
      function() {
        this.setState({
          cartBounce: false,
          quantity: 1
        });
      }.bind(this),
      1000
    );
    this.sumTotalItems(this.state.cart);
    this.sumTotalAmount(this.state.cart);
  }

  handleAction(action) {
    console.log(action);
    if (action == "สั่งซื้อ") {
      let cartItem = this.state.cart;
      this.state.cart.map(selectedProducts => {
        let productID = selectedProducts.id;
        let productQty = selectedProducts.quantity;
        fetch(
          "http://localhost:3010/ord/add?no=" +
            this.props.number +
            '&food="' +
            productID +
            '"&num=' +
            productQty
        ).catch(err => console.error(err));
        cartItem.push(selectedProducts);
      }),
        this.setState({
          ord: cartItem,
          cart: []
        }),
        fetch("http://localhost:3010/cart/ord?no=" + this.props.number).catch(
          err => console.error(err)
        );
      this.sumTotalItems(this.state.cart);
      this.sumTotalAmount(this.state.cart);
    } else if (action == "เก็บเงิน") {
    }
  }

  handleRemoveProduct(id, e) {
    let cart = this.state.cart;
    let index = cart.findIndex(x => x.id == id);
    cart.splice(index, 1);
    this.setState({
      cart: cart
    });
    this.sumTotalItems(this.state.cart);
    this.sumTotalAmount(this.state.cart);
    fetch(
      "http://localhost:3010/cart/del?no=" + this.props.number + '&food="' + id
    ).catch(err => console.error(err));
    e.preventDefault();
  }
  checkProduct(productID) {
    let cart = this.state.cart;
    return cart.some(function(item) {
      return item.id === productID;
    });
  }
  sumTotalItems() {
    let total = 0;
    let cart = this.state.cart;
    total = cart.length;
    this.setState({
      totalItems: total
    });
  }
  sumTotalAmount() {
    let total = 0;
    let cart = this.state.cart;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * parseInt(cart[i].quantity);
    }
    this.setState({
      totalAmount: total
    });
  }

  //Reset Quantity
  updateQuantity(qty) {
    this.setState({
      quantity: qty
    });
  }
  // Open Modal
  openModal(product) {
    this.setState({
      quickViewProduct: product,
      modalActive: true
    });
  }
  // Close Modal
  closeModal() {
    this.setState({
      modalActive: false
    });
  }
  handleTermChange(category) {
    this.setState({ term: category });
  }
  handleHomeSet() {
    this.setState({ term: "" });
  }
  render() {
    console.log(this.state.cart);
    return (
      <div className="Store">
        <Header
          cartBounce={this.state.cartBounce}
          total={this.state.totalAmount}
          totalItems={this.state.totalItems}
          cartItems={this.state.cart}
          ordItem={this.state.ord}
          removeProduct={this.handleRemoveProduct}
          handleSearch={this.handleSearch}
          handleMobileSearch={this.handleMobileSearch}
          handleAction={this.handleAction}
          handleCategory={this.handleCategory}
          categoryTerm={this.state.category}
          updateQuantity={this.updateQuantity}
          productQuantity={this.state.moq}
          homeSet={this.handleHomeSet}
        />
        <Products
          productsList={this.state.products}
          searchTerm={this.state.term}
          addToCart={this.handleAddToCart}
          termChange={this.handleTermChange}
          productQuantity={this.state.quantity}
          updateQuantity={this.updateQuantity}
          openModal={this.openModal}
        />
        <Footer />
        <QuickView
          product={this.state.quickViewProduct}
          openModal={this.state.modalActive}
          closeModal={this.closeModal}
        />
      </div>
    );
  }
}
export default Store;
