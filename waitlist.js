// The waitlist popup and the button that follows you down the page on phones.
(function () {
  "use strict";

  var dialog = document.getElementById("join-dialog");
  var form = document.getElementById("waitlist-form");
  var success = document.getElementById("success");
  var message = document.getElementById("form-message");
  var button = document.getElementById("submit");
  var email = document.getElementById("email");

  // ----- Opening and closing the popup -----
  document.querySelectorAll("[data-join]").forEach(function (joinButton) {
    joinButton.addEventListener("click", function () {
      dialog.showModal();
      if (!form.hidden) email.focus();
    });
  });

  function closeDialog() {
    dialog.close();
  }

  document.getElementById("dialog-close").addEventListener("click", closeDialog);
  document.getElementById("success-done").addEventListener("click", closeDialog);

  // Tapping the dark area outside the popup closes it too
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });

  // ----- The button that follows you once the main one has scrolled away -----
  var sticky = document.getElementById("sticky-cta");
  new IntersectionObserver(function (entries) {
    sticky.classList.toggle("sticky-on", !entries[0].isIntersecting);
  }).observe(document.getElementById("hero-join"));

  // ----- Saving a signup -----
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
    success.hidden = false;
    success.focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    message.textContent = "";

    var address = email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
      showError("Please enter a valid email address.");
      email.focus();
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

    button.disabled = true;
    button.textContent = "Joining…";

    fetch(config.url.replace(/\/$/, "") + "/rest/v1/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        Prefer: "return=minimal"
      },
      // Joining counts as consent: the text under the button says what you're agreeing to.
      body: JSON.stringify({ email: address, source: getSource(), consent: true })
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
