/* =====================================================
   TRENT CARD - INDEX.JS
   Admin + Search + Cart + Wishlist + Newsletter
   + Visitor Tracking
===================================================== */


/* =====================================================
   1. ADMIN ACCESS
===================================================== */

function checkAdminAccess(){

  if(localStorage.getItem("trentAdmin") === "true"){

    window.location.href =
      "backend/admin-products.html";

  }else{

    alert("Admin Login Required 🔐");

    window.location.href =
      "backend/admin-login.html";

  }

}


/* =====================================================
   2. ADMIN BUTTON VISIBILITY
===================================================== */

function setupAdminVisibility(){

  const adminButtons =
    document.querySelectorAll(".admin-btn");

  const isAdmin =
    localStorage.getItem("trentAdmin") === "true";


  adminButtons.forEach(function(button){

    if(isAdmin){

      button.style.display = "inline-flex";

    }else{

      button.style.display = "none";

    }

  });

}


/* =====================================================
   3. SEARCH PRODUCTS
===================================================== */

function searchProducts(){

  const input =
    document.getElementById("searchInput");

  const resultsBox =
    document.getElementById("searchResults");


  if(!input || !resultsBox){

    return;

  }


  const search =
    input.value
      .trim()
      .toLowerCase();


  /* EMPTY SEARCH */

  if(search === ""){

    resultsBox.innerHTML = "";

    resultsBox.style.display =
      "none";

    return;

  }


  /* CATEGORY SEARCH */

  const categories = [

    {
      keywords: [
        "shirt",
        "shirts",
        "tshirt",
        "t-shirts",
        "t shirt"
      ],

      name: "Shirts",

      page: "shirts.html"
    },


    {
      keywords: [
        "pant",
        "pants",
        "trouser",
        "trousers"
      ],

      name: "Pants",

      page: "pants.html"
    },


    {
      keywords: [
        "shoe",
        "shoes",
        "footwear"
      ],

      name: "Shoes",

      page: "shoes.html"
    },


    {
      keywords: [
        "hoodie",
        "hoodies"
      ],

      name: "Hoodies",

      page: "hoodies.html"
    },


    {
      keywords: [
        "accessory",
        "accessories",
        "accs"
      ],

      name: "Accessories",

      page: "accessories.html"
    }

  ];


  const matches = [];


  categories.forEach(function(category){

    const found =
      category.keywords.some(
        function(keyword){

          return (
            keyword.includes(search) ||
            search.includes(keyword)
          );

        }
      );


    if(found){

      matches.push(category);

    }

  });


  /* NO RESULT */

  if(matches.length === 0){

    resultsBox.innerHTML = `

      <div class="search-no-result">

        No category found for

        "<b>${escapeSearchText(search)}</b>"

      </div>

    `;


    resultsBox.style.display =
      "block";

    return;

  }


  /* SHOW RESULTS */

  resultsBox.innerHTML = "";


  matches.forEach(function(category){

    const item =
      document.createElement("div");


    item.className =
      "search-result-item";


    item.innerHTML = `

      <span class="search-result-name">

        ${category.name}

      </span>

      <span class="search-result-category">

        Explore →

      </span>

    `;


    item.onclick = function(){

      window.location.href =
        category.page;

    };


    resultsBox.appendChild(item);

  });


  resultsBox.style.display =
    "block";

}


/* =====================================================
   4. ESCAPE SEARCH TEXT
===================================================== */

function escapeSearchText(text){

  return text

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* =====================================================
   5. SETUP SEARCH
===================================================== */

function setupSearch(){

  const searchInput =
    document.getElementById("searchInput");


  if(!searchInput) return;


  searchInput.addEventListener(
    "input",
    function(){

      searchProducts();

    }
  );

}


/* =====================================================
   6. CLOSE SEARCH RESULTS
===================================================== */

document.addEventListener(
  "click",
  function(event){

    const searchBox =
      document.querySelector(".search-box");

    const resultsBox =
      document.getElementById("searchResults");


    if(

      searchBox &&

      resultsBox &&

      !searchBox.contains(event.target) &&

      !resultsBox.contains(event.target)

    ){

      resultsBox.style.display =
        "none";

    }

  }
);


/* =====================================================
   7. NAVBAR SMOOTH SCROLL
===================================================== */

document
  .querySelectorAll(
    '.nav-links a[href^="#"]'
  )
  .forEach(function(link){

    link.addEventListener(
      "click",
      function(event){

        const targetId =
          this.getAttribute("href");


        if(

          targetId === "#" ||

          targetId === ""

        ){

          return;

        }


        const target =
          document.querySelector(targetId);


        if(target){

          event.preventDefault();


          target.scrollIntoView({

            behavior:"smooth"

          });

        }

      }
    );

  });


/* =====================================================
   8. CART - GET FROM LOCAL STORAGE
===================================================== */

function getCart(){

  try{

    const cart =
      JSON.parse(
        localStorage.getItem(
          "trentCardCart"
        )
      );


    return Array.isArray(cart)
      ? cart
      : [];

  }

  catch(error){

    return [];

  }

}


/* =====================================================
   9. UPDATE CART COUNT
===================================================== */

function updateCartCount(){

  const cart =
    getCart();


  let total = 0;


  cart.forEach(function(item){

    total +=
      Number(item.quantity || 1);

  });


  const cartCountElement =
    document.getElementById(
      "cart-count"
    );


  if(cartCountElement){

    cartCountElement.innerText =
      total;

  }

}


/* =====================================================
   10. CART CLICK
===================================================== */

function goToCart(){

  window.location.href =
    "cart.html";

}


const cartElement =
  document.querySelector(".cart");


if(cartElement){

  cartElement.addEventListener(
    "click",
    function(){

      window.location.href =
        "cart.html";

    }
  );

}


/* =====================================================
   11. NEWSLETTER SUBSCRIBE
===================================================== */

function setupNewsletter(){

  const newsletterForm =
    document.getElementById(
      "newsletterForm"
    );


  const emailInput =
    document.getElementById(
      "newsletterEmail"
    );


  const message =
    document.getElementById(
      "newsletterMessage"
    );


  if(

    !newsletterForm ||

    !emailInput ||

    !message

  ){

    return;

  }


  /* PREVENT DOUBLE SUBMIT */

  let isSubmitting = false;


  newsletterForm.addEventListener(
    "submit",
    async function(event){

      event.preventDefault();


      /* STOP DOUBLE REQUEST */

      if(isSubmitting){

        return;

      }


      const email =
        emailInput.value
          .trim()
          .toLowerCase();


      /* EMPTY EMAIL */

      if(email === ""){

        message.textContent =
          "Please enter your email.";

        message.style.color =
          "#d6b77a";

        return;

      }


      /* EMAIL VALIDATION */

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if(!emailPattern.test(email)){

        message.textContent =
          "Please enter a valid email.";

        message.style.color =
          "#d6b77a";

        return;

      }


      const button =
        newsletterForm.querySelector(
          "button"
        );


      /* START SUBMIT */

      isSubmitting = true;


      if(button){

        button.disabled = true;

        button.textContent =
          "SUBSCRIBING...";

      }


      message.textContent =
        "Please wait...";


      try{

        const response =
          await fetch(
            "http://localhost:5000/api/subscribe",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                email: email
              })

            }
          );


        const data =
          await response.json();


        /* SUCCESS */

        if(
          response.ok &&
          data.success
        ){

          message.textContent =
            "✓ Successfully subscribed!";

          message.style.color =
            "#7fc97f";


          emailInput.value = "";

        }


        /* DUPLICATE EMAIL */

        else if(response.status === 409){

          message.textContent =
            data.message ||
            "This email is already subscribed.";

          message.style.color =
            "#d6b77a";

        }


        /* OTHER SERVER ERROR */

        else{

          message.textContent =
            data.message ||
            "Unable to subscribe. Please try again.";

          message.style.color =
            "#d6b77a";

        }

      }


      catch(error){

        console.error(
          "Newsletter Error:",
          error
        );


        message.textContent =
          "Server connection failed.";

        message.style.color =
          "#d6b77a";

      }


      /* ENABLE AGAIN */

      isSubmitting = false;


      if(button){

        button.disabled = false;

        button.textContent =
          "SUBSCRIBE";

      }

    }

  );

}


/* =====================================================
   12. VISITOR TRACKING
===================================================== */

function getVisitorId(){

  let visitorId =
    localStorage.getItem(
      "trentCardVisitorId"
    );


  /* CREATE NEW ANONYMOUS VISITOR ID */

  if(!visitorId){

    if(
      window.crypto &&
      crypto.randomUUID
    ){

      visitorId =
        crypto.randomUUID();

    }else{

      visitorId =
        "visitor-" +
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2, 12);

    }


    localStorage.setItem(
      "trentCardVisitorId",
      visitorId
    );

  }


  return visitorId;

}


/* =====================================================
   SEND VISITOR TO BACKEND
===================================================== */

async function trackVisitor(){

  try{

    const visitorId =
      getVisitorId();


    const currentPage =
      window.location.pathname;


    const response =
      await fetch(
        "http://localhost:5000/api/visitor",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            visitorId:
              visitorId,

            page:
              currentPage

          })

        }
      );


    const data =
      await response.json();


    if(data.success){

      console.log(
        "👤 Visitor tracked successfully"
      );

    }else{

      console.log(
        "⚠️ Visitor tracking failed:",
        data.message
      );

    }

  }

  catch(error){

    console.error(
      "❌ Visitor Tracking Error:",
      error
    );

  }

}


/* =====================================================
   13. WISHLIST - GET
===================================================== */

function getWishlist(){

  try{

    const wishlist =
      JSON.parse(
        localStorage.getItem(
          "trentCardWishlist"
        )
      );


    return Array.isArray(wishlist)
      ? wishlist
      : [];

  }

  catch(error){

    return [];

  }

}


/* =====================================================
   14. SAVE WISHLIST
===================================================== */

function saveWishlist(wishlist){

  localStorage.setItem(

    "trentCardWishlist",

    JSON.stringify(wishlist)

  );


  updateWishlistCount();

}


/* =====================================================
   15. UPDATE WISHLIST COUNT
===================================================== */

function updateWishlistCount(){

  const wishlist =
    getWishlist();


  const count =
    document.getElementById(
      "wishlist-count"
    );


  if(count){

    count.innerText =
      wishlist.length;

  }

}


/* =====================================================
   16. GET WISHLIST CATEGORY
===================================================== */

function getWishlistCategory(link){

  if(!link){

    return "MEN'S FASHION";

  }


  const lowerLink =
    link.toLowerCase();


  if(lowerLink.includes("shirts")){

    return "MEN'S SHIRT";

  }


  if(lowerLink.includes("pants")){

    return "MEN'S PANTS";

  }


  if(lowerLink.includes("shoes")){

    return "FOOTWEAR";

  }


  if(lowerLink.includes("hoodies")){

    return "MEN'S HOODIE";

  }


  if(lowerLink.includes("accessories")){

    return "ACCESSORIES";

  }


  return "MEN'S FASHION";

}


/* =====================================================
   17. TOGGLE WISHLIST
===================================================== */

function toggleWishlist(

  name,

  price,

  image,

  link,

  button

){

  let wishlist =
    getWishlist();


  const existingIndex =
    wishlist.findIndex(
      function(item){

        return item.product === name;

      }
    );


  /* REMOVE */

  if(existingIndex !== -1){

    wishlist.splice(
      existingIndex,
      1
    );


    if(button){

      button.innerText =
        "♡";


      button.classList.remove(
        "liked"
      );

    }


    showWishlistMessage(
      "Removed from Wishlist"
    );

  }


  /* ADD */

  else{

    wishlist.push({

      product: name,

      price:
        Number(price) || 0,

      image: image,

      link: link,

      category:
        getWishlistCategory(link)

    });


    if(button){

      button.innerText =
        "♥";


      button.classList.add(
        "liked"
      );

    }


    showWishlistMessage(
      "Added to Wishlist ❤️"
    );

  }


  saveWishlist(wishlist);

}


/* =====================================================
   18. WISHLIST PAGE
===================================================== */

function goToWishlist(){

  window.location.href =
    "wishlist.html";

}


/* =====================================================
   19. WISHLIST TOAST
===================================================== */

function showWishlistMessage(text){

  let toast =
    document.getElementById(
      "wishlistToast"
    );


  if(!toast){

    toast =
      document.createElement("div");


    toast.id =
      "wishlistToast";


    toast.style.position =
      "fixed";


    toast.style.bottom =
      "25px";


    toast.style.right =
      "25px";


    toast.style.background =
      "#111";


    toast.style.color =
      "white";


    toast.style.padding =
      "13px 20px";


    toast.style.borderRadius =
      "25px";


    toast.style.fontSize =
      "12px";


    toast.style.fontWeight =
      "bold";


    toast.style.border =
      "1px solid #b08d57";


    toast.style.zIndex =
      "99999";


    toast.style.transition =
      ".3s";


    document.body.appendChild(
      toast
    );

  }


  toast.innerText =
    text;


  toast.style.opacity =
    "1";


  clearTimeout(
    window.wishlistToastTimer
  );


  window.wishlistToastTimer =
    setTimeout(
      function(){

        toast.style.opacity =
          "0";

      },
      1800
    );

}


/* =====================================================
   20. RESTORE LIKED HEARTS
===================================================== */

function restoreWishlistHearts(){

  const wishlist =
    getWishlist();


  document
    .querySelectorAll(".wishlist-heart")
    .forEach(
      function(button){

        const product =
          button.dataset.product;


        const exists =
          wishlist.some(
            function(item){

              return (
                item.product ===
                product
              );

            }
          );


        if(exists){

          button.innerText =
            "♥";


          button.classList.add(
            "liked"
          );

        }

        else{

          button.innerText =
            "♡";


          button.classList.remove(
            "liked"
          );

        }

      }
    );

}


/* =====================================================
   21. STORAGE CHANGE
===================================================== */

window.addEventListener(
  "storage",
  function(event){

    if(
      event.key ===
      "trentCardCart"
    ){

      updateCartCount();

    }


    if(
      event.key ===
      "trentCardWishlist"
    ){

      updateWishlistCount();

      restoreWishlistHearts();

    }

  }
);


/* =====================================================
   22. UPDATE WHEN PAGE BECOMES ACTIVE
===================================================== */

window.addEventListener(
  "focus",
  function(){

    updateCartCount();

    updateWishlistCount();

    setupAdminVisibility();

    restoreWishlistHearts();

  }
);


/* =====================================================
   23. PAGE LOAD
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    setupSearch();

    setupNewsletter();

    trackVisitor();

    updateCartCount();

    updateWishlistCount();

    restoreWishlistHearts();

    setupAdminVisibility();

  }
);


/* =====================================================
   24. INITIAL LOAD
===================================================== */

updateCartCount();

updateWishlistCount();

setupAdminVisibility();