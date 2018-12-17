function h (input) {
  hash = new sjcl.hash.sha256();
  hash.reset();
  hash.update(input);
  return sjcl.codec.hex.fromBits(hash.finalize());
}
window.onload = function () {
  let url = new URL(window.location.href);
  if (!url.searchParams.get('auth_token')) {
    // Check for localstorage
  } else {
    let token = url.searchParams.get('auth_token');
    let correct = document.querySelector('input.correct').value;
    if (h(token) === correct) {
      let redirect = window.location.protocol + '//' + window.location.host + '/' + token;
      console.log(redirect);
      window.location.replace(redirect);
    } else {
      document.body.innerText = "You're not who you say you are!";
    }
  }
}
