function h (input) {
  hash = new sjcl.hash.sha256();
  hash.reset();
  hash.update(input);
  return sjcl.codec.hex.fromBits(hash.finalize());
}

function loadContent(token) {
  let url = window.location.protocol + '//' + window.location.host + '/' + token;
  fetch(url)
    .then(res => res.text())
    .then(text => document.write(text));
}

function check_token(token) {
  let correct = document.querySelector('input.correct').value;
  if (h(token) === correct) {
    window.localStorage.setItem('token', token);
    loadContent(token);
  } else {
    document.body.innerText = "You're not who you say you are!";
  }
}

window.onload = function () {
  let url = new URL(window.location.href);
  if (!url.searchParams.get('auth_token')) {
    // Check for localstorage
    let token = window.localStorage.getItem('token');
    if (token) {
      check_token(token);
    } else {
      document.body.innerText = "Missing auth token";
    }
  } else {
    let token = url.searchParams.get('auth_token');
    check_token(token);
  }
}
