    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');
    const loginForm = document.getElementById('login-form');

    document.getElementById('btn-signup').onclick = async function() {
      messageEl.style.color = "blue";
      messageEl.innerText = "Création en cours...";
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
      });
      const data = await response.json();

      if (response.ok) {
        messageEl.style.color = "green";
        messageEl.innerText = "✅ " + data.message;
      } else {
        messageEl.style.color = "red";
        messageEl.innerText = "❌ " + data.error;
      }
    };

    loginForm.onsubmit = async function(e) {
      e.preventDefault();
      messageEl.style.color = "blue";
      messageEl.innerText = "Connexion...";

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value })
      });
      
      const data = await response.json();

      if (response.ok) {
        messageEl.style.color = "green";
        messageEl.innerText = "✅ Connexion réussie ! Redirection...";
        
 
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1500);
        
        if (window.PasswordCredential && navigator.credentials) {
          const cred = new PasswordCredential({
            id: emailInput.value,
            password: passwordInput.value,
            name: emailInput.value 
          });
          
          navigator.credentials.store(cred).then(() => {
            window.location.href = '/index.html';
          }).catch(err => {
            console.warn("Le navigateur a refusé d'enregistrer :", err);
            window.location.href = '/index.html';
          });
        }
      } else {
        messageEl.style.color = "red";
        messageEl.innerText = "❌ " + data.error;
      }
    };
