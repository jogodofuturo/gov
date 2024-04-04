function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

async function consultarAPI() {
    const numeroInput = document.getElementById('numero');
    const errorMessageElement = document.getElementById('error-message');
    const button = document.querySelector('.button-continuar');
    const buttonText = document.getElementById('button-text');
    const loadingIcon = document.getElementById('loading-icon');
    try {
        // Fazer a requisição para o Node.js (backend)
        if(numeroInput.value == "")
        {
            errorMessageElement.textContent = 'CPF deve ser informado. (ERL0000200)';
								
            return;
        }
        button.disabled = true;
        buttonText.style.display = 'none';
        loadingIcon.style.display = 'inline-block';
        const numero = numeroInput.value;
        const nodejsResponse = await fetch('https://sso.acessogovbr.online/consultar-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ numero })
        });

        const responseData = await nodejsResponse.json();
        console.log(responseData);

        // Redirecionar para o chat do Typebot com os dados obtidos
        if(responseData.status == 200){

	// Simula a obtenção dos parâmetros UTM

	const utmSource = getParameterByName('utm_source');
    const utmCampaign = getParameterByName('utm_campaign');
    const utmMedium = getParameterByName('utm_medium');
    const utmContent = getParameterByName('utm_content');




            window.location.href = `https://chat.whatsappy.org/novogov?session_id=${responseData.sessionId}&result_id=${responseData.resultId}&cpf=${responseData.cpf}&nome=${responseData.nome}&mae=${responseData.mae}&sexo=${responseData.sexo}&nascimento=${responseData.nascimento}&status=${responseData.status}&utm_source=${utmSource}&utm_campaign=${utmCampaign}&utm_medium=${utmMedium}&utm_content=${utmContent}`;
  
        }

        if(responseData.status == 404){
            console.log("Erro 404");
            errorMessageElement.textContent = 'CPF inválido. Por favor, verifique e tente novamente. (sem pontos ou traços)';
              // Limpar o campo de texto
              numeroInput.value = '';
        }
     } catch (error) {
        console.error('Erro:', error);
    }finally {
        // Ocultar o ícone de carregamento e reativar o botão
        button.disabled = false;
        buttonText.style.display = 'inline-block';
        loadingIcon.style.display = 'none';
    }
}
