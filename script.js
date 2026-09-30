

/* =========================================
   PRODUCT DETAILS
========================================= */

let currentProduct = {};

let productQuantity = 1;


/* OPEN PRODUCT DETAILS */

function openProductDetails(
  name,
  price,
  image,
  description
){

  currentProduct = {

    name: name,

    price: price,

    image: image,

    description: description

  };


  document.getElementById(
    "modalProductImage"
  ).src = image;


  document.getElementById(
    "modalProductName"
  ).innerText = name;


  document.getElementById(
    "modalProductPrice"
  ).innerText = price;


  document.getElementById(
    "modalProductDescription"
  ).innerText = description;


  /* RESET SIZE */

  document.getElementById(
    "modalSize"
  ).value = "";


  /* RESET QUANTITY */

  productQuantity = 1;


  document.getElementById(
    "quantity"
  ).innerText = productQuantity;


  /* SHOW POPUP */

  document.getElementById(
    "productModal"
  ).classList.add("active");

}


/* CLOSE */

function closeProductDetails(){

  document.getElementById(
    "productModal"
  ).classList.remove("active");

}


/* QUANTITY */

function changeQuantity(number){

  productQuantity += number;


  if(productQuantity < 1){

    productQuantity = 1;

  }


  if(productQuantity > 10){

    productQuantity = 10;

  }


  document.getElementById(
    "quantity"
  ).innerText = productQuantity;

}


/* CONFIRM ORDER */

function confirmOrder(){

  const size =
    document.getElementById(
      "modalSize"
    ).value;


  if(size === ""){

    alert(
      "Please select your size."
    );

    return;

  }


  alert(

    "ORDER DETAILS\n\n" +

    "Product : " +
    currentProduct.name +

    "\nPrice : " +
    currentProduct.price +

    "\nSize : " +
    size +

    "\nQuantity : " +
    productQuantity +

    "\n\nOrder confirmed successfully!"

  );


  closeProductDetails();

}


/* CLOSE WHEN CLICK OUTSIDE */

document.addEventListener(
  "click",
  function(event){

    const modal =
      document.getElementById(
        "productModal"
      );


    if(
      event.target === modal
    ){

      closeProductDetails();

    }

  }
);