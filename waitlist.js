// The waitlist form and the cost calculator.
(function () {
  "use strict";

  // ----- Calculator: runs only in the visitor's browser, nothing is sent -----
  var RENT_PER_MONTH = 1700;
  var TRIP = 1500;
  var slider = document.getElementById("weekly");

  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }

  function plural(n, word) {
    return n + " " + word + (n === 1 ? "" : "s");
  }

  function updateCalculator() {
    var weekly = Number(slider.value);
    var yearly = weekly * 52;
    var months = Math.floor(yearly / RENT_PER_MONTH);
    var trips = Math.floor(yearly / TRIP);
    document.getElementById("weekly-value").textContent = money(weekly);
    document.getElementById("year-value").textContent = money(yearly);
    document.getElementById("could-buy").textContent = months < 1
      ? "It adds up faster than it feels."
      : "That's about " + plural(months, "month") + " of rent, or " + plural(trips, "trip") + ".";
  }

  slider.addEventListener("input", updateCalculator);
  updateCalculator();

  // ----- Waitlist form -----
  var form = document.getElementById("waitlist-form");
  var message = document.getElementById("form-message");
  var button = document.getElementById("submit");

  // Which link brought this visitor, e.g. ?s=tiktok. Tells us which platform brings signups.
  function getSource() {
    var raw = new URLSearchParams(window.location.search).get("s") || "direct";
    var clean = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    return clean || "direct";
  }

  function showError(text) {
    message.textContent = text;
    button.disabled = false;
    button.textContent = "Join the waitlist";
  }

  function showSuccess() {
    form.hidden = true;
    var success = document.getElementById("success");
    success.hidden = false;
    success.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    message.textContent = "";

    var email = form.elements.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      showError("Please enter a valid email address.");
      form.elements.email.focus();
      return;
    }
    if (!document.getElementById("consent").checked) {
      showError("Please tick the box so we're allowed to email you.");
      return;
    }

    // A filled-in trap means a bot: look successful, save nothing.
    if (form.elements.website.value) {
      showSuccess();
      return;
    }

    var config = window.UNBET_WAITLIST || {};
    if (!config.url || !config.key) {
      showError("The waitlist isn't connected yet. Your email was not saved.");
      return;
    }

    var who = form.querySelector('input[name="signing_up_for"]:checked');
    var types = Array.prototype.map.call(
      form.querySelectorAll('input[name="betting_types"]:checked'),
      function (box) { return box.value; }
    );

    button.disabled = true;
    button.textContent = "Joining…";

    fetch(config.url.replace(/\/$/, "") + "/rest/v1/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        email: email,
        signing_up_for: who ? who.value : null,
        betting_types: types,
        source: getSource(),
        consent: true
      })
    }).then(function (response) {
      // 409 means this email already joined. We show the same result on purpose,
      // so nobody can use this form to find out whether a person has signed up.
      if (response.ok || response.status === 409) {
        showSuccess();
      } else {
        showError("That didn't save. Please try again in a moment.");
      }
    }).catch(function () {
      showError("Couldn't reach the waitlist. Check your connection and try again.");
    });
  });
})();
