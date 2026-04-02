// Função para o clique em Esqueci Senha
function handleResetPassword() {
    const cpf = document.getElementById('cpf').value;
    
    if (!cpf) {
        alert("Por favor, digite seu CPF primeiro para recuperarmos sua senha.");
    } else {
        alert(`Um e-mail de recuperação foi enviado para o endereço cadastrado vinculado ao CPF: ${cpf}`);
    }
}

// Máscara de CPF automática
document.getElementById('cpf').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    e.target.value = v;
});

// Login Form
document.getElementById('loginFormPaciente').addEventListener('submit', function(e) {
    e.preventDefault();
    alert("Iniciando acesso ao portal...");
});
// Login Form
document.getElementById('loginFormPaciente').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede o recarregamento da página

    // Captura os valores (caso queira validar algo antes)
    const cpf = document.getElementById('cpf').value;
    const password = document.getElementById('password').value;

    if (cpf.length === 14 && password.length > 0) {
        alert("Acesso autorizado! Bem-vindo ao seu portal.");

        // Redireciona para o arquivo do dashboard
        // Certifique-se de que o nome do arquivo seja exatamente igual ao que você salvou
        window.location.href = "dash-paciente.html"; 
    } else {
        alert("Por favor, preencha o CPF e a senha corretamente.");
    }
});