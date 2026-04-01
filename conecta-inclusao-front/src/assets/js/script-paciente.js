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