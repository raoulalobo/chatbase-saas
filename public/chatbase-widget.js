/**
 * Widget ChatBase - Intégration agent IA pour sites externes
 * Version: 1.0.0
 * 
 * Usage:
 * <script>
 *   window.ChatbaseConfig = {
 *     agentId: 'votre-agent-id',
 *     publicApiKey: 'votre-cle-api-publique',
 *     baseUrl: 'https://votre-domain.com', // optionnel
 *     position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
 *     primaryColor: '#3b82f6',
 *     title: 'Assistant virtuel',
 *     subtitle: 'Comment puis-je vous aider ?',
 *     placeholder: 'Tapez votre message...',
 *     autoOpen: false,
 *     height: '600px',
 *     width: '380px'
 *   }
 * </script>
 * <script src="https://votre-domain.com/chatbase-widget.js"></script>
 */

(function() {
  'use strict';

  // Configuration par défaut
  const DEFAULT_CONFIG = {
    baseUrl: 'http://localhost:3000', // Sera remplacé par l'URL de production
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    title: 'Assistant virtuel',
    subtitle: 'Comment puis-je vous aider ?',
    placeholder: 'Tapez votre message...',
    autoOpen: false,
    height: '600px',
    width: '380px',
    buttonSize: '60px',
    zIndex: '9999',
    animation: true,
    showBranding: true
  };

  // Variables globales du widget
  let config = {};
  let isWidgetOpen = false;
  let conversationId = null;
  let visitorId = null;
  let widgetContainer = null;
  let chatMessages = [];
  let isLoading = false;

  /**
   * Initialisation du widget ChatBase
   */
  function initChatbaseWidget() {
    // Fusion configuration utilisateur avec défauts
    config = Object.assign({}, DEFAULT_CONFIG, window.ChatbaseConfig || {});
    
    // Validation configuration requise
    if (!config.agentId || !config.publicApiKey) {
      console.error('ChatBase Widget: agentId et publicApiKey sont requis');
      return;
    }

    // Générer ID visiteur unique
    visitorId = generateVisitorId();
    
    // Créer les styles CSS
    injectStyles();
    
    // Créer le HTML du widget
    createWidget();
    
    // Attacher les événements
    attachEventListeners();
    
    // Auto-ouverture si configuré
    if (config.autoOpen) {
      setTimeout(() => openChat(), 1000);
    }

    console.log('ChatBase Widget initialisé avec succès');
  }

  /**
   * Génération ID visiteur unique (persiste en localStorage)
   */
  function generateVisitorId() {
    let id = localStorage.getItem('chatbase_visitor_id');
    if (!id) {
      id = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('chatbase_visitor_id', id);
    }
    return id;
  }

  /**
   * Injection des styles CSS du widget
   */
  function injectStyles() {
    const styles = `
      .chatbase-widget-container {
        position: fixed;
        ${getPositionStyles()}
        z-index: ${config.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .chatbase-widget-button {
        width: ${config.buttonSize};
        height: ${config.buttonSize};
        background: ${config.primaryColor};
        border: none;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        color: white;
        font-size: 24px;
      }
      
      .chatbase-widget-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
      
      .chatbase-widget-chat {
        width: ${config.width};
        height: ${config.height};
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: none;
        flex-direction: column;
        position: absolute;
        ${getPositionStyles(true)}
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }
      
      .chatbase-widget-chat.open {
        display: flex;
        animation: ${config.animation ? 'chatbaseSlideUp 0.3s ease-out' : 'none'};
      }
      
      @keyframes chatbaseSlideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      
      .chatbase-widget-header {
        background: ${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .chatbase-widget-header-content h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .chatbase-widget-header-content p {
        margin: 4px 0 0 0;
        font-size: 13px;
        opacity: 0.9;
      }
      
      .chatbase-widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      
      .chatbase-widget-close:hover {
        opacity: 1;
      }
      
      .chatbase-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .chatbase-message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 18px;
        word-wrap: break-word;
        line-height: 1.4;
      }
      
      .chatbase-message.user {
        background: ${config.primaryColor};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 6px;
      }
      
      .chatbase-message.bot {
        background: white;
        color: #374151;
        align-self: flex-start;
        border: 1px solid #e5e7eb;
        border-bottom-left-radius: 6px;
      }
      
      .chatbase-message.loading {
        background: white;
        border: 1px solid #e5e7eb;
        align-self: flex-start;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .chatbase-loading-dots {
        display: flex;
        gap: 4px;
      }
      
      .chatbase-loading-dot {
        width: 6px;
        height: 6px;
        background: #9ca3af;
        border-radius: 50%;
        animation: chatbasePulse 1.4s infinite both;
      }
      
      .chatbase-loading-dot:nth-child(1) { animation-delay: -0.32s; }
      .chatbase-loading-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes chatbasePulse {
        0%, 80%, 100% { opacity: 0.4; transform: scale(1); }
        40% { opacity: 1; transform: scale(1.1); }
      }
      
      .chatbase-widget-input {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .chatbase-widget-input input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      .chatbase-widget-input input:focus {
        border-color: ${config.primaryColor};
      }
      
      .chatbase-widget-send {
        background: ${config.primaryColor};
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: all 0.2s;
      }
      
      .chatbase-widget-send:hover:not(:disabled) {
        transform: scale(1.05);
      }
      
      .chatbase-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .chatbase-widget-branding {
        padding: 8px 16px;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        background: #f8fafc;
        border-top: 1px solid #e5e7eb;
      }
      
      .chatbase-widget-branding a {
        color: inherit;
        text-decoration: none;
      }
      
      .chatbase-widget-branding a:hover {
        text-decoration: underline;
      }
      
      /* Styles responsive */
      @media (max-width: 768px) {
        .chatbase-widget-chat {
          width: 100vw !important;
          height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          border-radius: 0 !important;
          z-index: ${parseInt(config.zIndex) + 1};
        }
      }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  /**
   * Calcul des styles de positionnement selon la configuration
   */
  function getPositionStyles(isChat = false) {
    const offset = isChat ? '80px' : '20px';
    
    switch (config.position) {
      case 'bottom-left':
        return `bottom: ${offset}; left: 20px;`;
      case 'top-right':
        return `top: ${offset}; right: 20px;`;
      case 'top-left':
        return `top: ${offset}; left: 20px;`;
      case 'bottom-right':
      default:
        return `bottom: ${offset}; right: 20px;`;
    }
  }

  /**
   * Création du HTML du widget
   */
  function createWidget() {
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'chatbase-widget-container';
    
    widgetContainer.innerHTML = `
      <button class="chatbase-widget-button" id="chatbase-toggle">
        💬
      </button>
      
      <div class="chatbase-widget-chat" id="chatbase-chat">
        <div class="chatbase-widget-header">
          <div class="chatbase-widget-header-content">
            <h3>${escapeHtml(config.title)}</h3>
            <p>${escapeHtml(config.subtitle)}</p>
          </div>
          <button class="chatbase-widget-close" id="chatbase-close">
            ✕
          </button>
        </div>
        
        <div class="chatbase-widget-messages" id="chatbase-messages">
          <div class="chatbase-message bot">
            Bonjour ! ${escapeHtml(config.subtitle)}
          </div>
        </div>
        
        <div class="chatbase-widget-input">
          <input 
            type="text" 
            placeholder="${escapeHtml(config.placeholder)}"
            id="chatbase-input"
            maxlength="2000"
          />
          <button class="chatbase-widget-send" id="chatbase-send">
            ➤
          </button>
        </div>
        
        ${config.showBranding ? `
          <div class="chatbase-widget-branding">
            Propulsé par <a href="#" target="_blank">ChatBase</a>
          </div>
        ` : ''}
      </div>
    `;
    
    document.body.appendChild(widgetContainer);
  }

  /**
   * Attacher les événements aux éléments du widget
   */
  function attachEventListeners() {
    const toggleBtn = document.getElementById('chatbase-toggle');
    const closeBtn = document.getElementById('chatbase-close');
    const sendBtn = document.getElementById('chatbase-send');
    const input = document.getElementById('chatbase-input');
    
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', closeChat);
    sendBtn.addEventListener('click', sendMessage);
    
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Fermer au clic externe (optionnel)
    document.addEventListener('click', function(e) {
      const chatElement = document.getElementById('chatbase-chat');
      if (isWidgetOpen && !widgetContainer.contains(e.target) && chatElement.classList.contains('open')) {
        closeChat();
      }
    });
  }

  /**
   * Basculer l'état ouvert/fermé du chat
   */
  function toggleChat() {
    if (isWidgetOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  /**
   * Ouvrir le chat
   */
  function openChat() {
    const chatElement = document.getElementById('chatbase-chat');
    const toggleBtn = document.getElementById('chatbase-toggle');
    
    chatElement.classList.add('open');
    toggleBtn.style.display = 'none';
    isWidgetOpen = true;
    
    // Focus sur l'input
    setTimeout(() => {
      document.getElementById('chatbase-input').focus();
    }, 100);
  }

  /**
   * Fermer le chat
   */
  function closeChat() {
    const chatElement = document.getElementById('chatbase-chat');
    const toggleBtn = document.getElementById('chatbase-toggle');
    
    chatElement.classList.remove('open');
    toggleBtn.style.display = 'flex';
    isWidgetOpen = false;
  }

  /**
   * Envoyer un message
   */
  async function sendMessage() {
    const input = document.getElementById('chatbase-input');
    const message = input.value.trim();
    
    if (!message || isLoading) return;
    
    // Ajouter message utilisateur à l'interface
    addMessage(message, 'user');
    input.value = '';
    
    // Afficher indicateur de chargement
    showLoadingMessage();
    isLoading = true;
    updateSendButton(true);
    
    try {
      // Appel API
      const response = await fetch(`${config.baseUrl}/api/public/agents/${config.agentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Public-API-Key': config.publicApiKey,
          'X-Domain': window.location.hostname
        },
        body: JSON.stringify({
          message: message,
          conversationId: conversationId,
          visitorId: visitorId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de communication');
      }
      
      // Mettre à jour l'ID de conversation
      if (data.conversationId) {
        conversationId = data.conversationId;
      }
      
      // Masquer le chargement et afficher la réponse
      hideLoadingMessage();
      addMessage(data.response, 'bot');
      
    } catch (error) {
      console.error('Erreur ChatBase:', error);
      hideLoadingMessage();
      addMessage(
        'Désolé, une erreur est survenue. Veuillez réessayer dans quelques instants.', 
        'bot'
      );
    } finally {
      isLoading = false;
      updateSendButton(false);
      input.focus();
    }
  }

  /**
   * Ajouter un message à l'interface de chat
   */
  function addMessage(content, type) {
    const messagesContainer = document.getElementById('chatbase-messages');
    const messageElement = document.createElement('div');
    
    messageElement.className = `chatbase-message ${type}`;
    messageElement.textContent = content;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Stocker en mémoire
    chatMessages.push({ content, type, timestamp: Date.now() });
  }

  /**
   * Afficher le message de chargement
   */
  function showLoadingMessage() {
    const messagesContainer = document.getElementById('chatbase-messages');
    const loadingElement = document.createElement('div');
    
    loadingElement.className = 'chatbase-message loading';
    loadingElement.id = 'chatbase-loading';
    loadingElement.innerHTML = `
      Réflexion en cours...
      <div class="chatbase-loading-dots">
        <div class="chatbase-loading-dot"></div>
        <div class="chatbase-loading-dot"></div>
        <div class="chatbase-loading-dot"></div>
      </div>
    `;
    
    messagesContainer.appendChild(loadingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Masquer le message de chargement
   */
  function hideLoadingMessage() {
    const loadingElement = document.getElementById('chatbase-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  /**
   * Mettre à jour l'état du bouton d'envoi
   */
  function updateSendButton(disabled) {
    const sendBtn = document.getElementById('chatbase-send');
    const input = document.getElementById('chatbase-input');
    
    sendBtn.disabled = disabled;
    input.disabled = disabled;
    
    if (disabled) {
      sendBtn.innerHTML = '⏳';
    } else {
      sendBtn.innerHTML = '➤';
    }
  }

  /**
   * Échapper le HTML pour éviter les injections XSS
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Initialisation automatique quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbaseWidget);
  } else {
    initChatbaseWidget();
  }

  // API publique pour contrôle externe
  window.ChatbaseWidget = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    sendMessage: function(message) {
      if (message && typeof message === 'string') {
        document.getElementById('chatbase-input').value = message;
        sendMessage();
      }
    },
    getMessages: function() {
      return [...chatMessages];
    },
    clearHistory: function() {
      const messagesContainer = document.getElementById('chatbase-messages');
      messagesContainer.innerHTML = `
        <div class="chatbase-message bot">
          Bonjour ! ${escapeHtml(config.subtitle)}
        </div>
      `;
      chatMessages = [];
      conversationId = null;
    }
  };

})();