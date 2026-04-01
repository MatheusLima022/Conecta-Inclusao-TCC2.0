document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const crm = document.getElementById('crm').value;
    const password = document.getElementById('password').value;

    // Simulação de autenticação
    if(crm && password) {
        console.log("Tentando login para CRM:", crm);
        
        // Efeito visual no botão
        const btn = document.querySelector('.btn-login');
        btn.innerText = "Autenticando...";
        btn.style.opacity = "0.7";
        btn.disabled = true;

        setTimeout(() => {
            alert("Acesso autorizado! Redirecionando para o painel...");
            // window.location.href = "dashboard.html"; 
        }, 1500);
    }
});

document.getElementById('buttonEnter').addEventListener('click', () => {
    window.location.href = "../pages/dashboard-medico.html";
});