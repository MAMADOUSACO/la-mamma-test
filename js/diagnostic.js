/**
 * Utilitaire de diagnostic pour détecter les problèmes silencieux
 * À utiliser temporairement pendant le développement
 */

(function() {
    console.log("🔍 Diagnostic tool initialized");
    
    // Intercepter toutes les erreurs non capturées
    window.addEventListener('error', function(event) {
      console.error('📛 UNCAUGHT ERROR:', event.error || event.message);
      displayDiagnostic(`
        <h3>Une erreur non capturée s'est produite:</h3>
        <p>${event.error ? event.error.stack || event.error.message : event.message}</p>
        <p>Source: ${event.filename}, ligne ${event.lineno}:${event.colno}</p>
      `);
      return false;
    });
    
    // Intercepter les rejets de promesses non gérés
    window.addEventListener('unhandledrejection', function(event) {
      console.error('📛 UNHANDLED PROMISE REJECTION:', event.reason);
      displayDiagnostic(`
        <h3>Rejet de promesse non géré:</h3>
        <p>${event.reason instanceof Error ? event.reason.stack || event.reason.message : JSON.stringify(event.reason)}</p>
      `);
      return false;
    });
    
    // Vérifier les objets essentiels
    setTimeout(function() {
      console.log("🔍 Checking essential objects...");
      
      const essentialObjects = [
        { name: 'window.services.auth', object: window.services?.auth },
        { name: 'window.services.notification', object: window.services?.notification },
        { name: 'window.router', object: window.router },
        { name: 'window.views.Dashboard', object: window.views?.Dashboard },
        { name: 'window.views.Login', object: window.views?.Login },
        { name: 'window.AppConfig', object: window.AppConfig },
        { name: 'window.DefaultsConfig', object: window.DefaultsConfig },
        { name: 'window.RoutesConfig', object: window.RoutesConfig }
      ];
      
      const missing = essentialObjects.filter(item => !item.object);
      
      if (missing.length > 0) {
        console.error('📛 MISSING ESSENTIAL OBJECTS:', missing.map(item => item.name));
        displayDiagnostic(`
          <h3>Des objets essentiels sont manquants:</h3>
          <ul>
            ${missing.map(item => `<li>${item.name}</li>`).join('')}
          </ul>
          <p>Ces objets sont nécessaires au fonctionnement de l'application.</p>
        `);
      } else {
        console.log("✅ All essential objects are present");
      }
      
      // Vérifier que le router fonctionne
      if (window.router) {
        try {
          console.log("🔍 Current route:", window.router.getCurrentRoute());
        } catch (e) {
          console.error('📛 ERROR ACCESSING CURRENT ROUTE:', e);
          displayDiagnostic(`
            <h3>Erreur d'accès à la route courante:</h3>
            <p>${e.stack || e.message}</p>
          `);
        }
      }
  
      // Vérifier l'état d'authentification
      if (window.services?.auth) {
        try {
          const isAuthenticated = window.services.auth.isAuthenticated();
          console.log("🔍 Authentication status:", isAuthenticated ? "Authenticated" : "Not authenticated");
        } catch (e) {
          console.error('📛 ERROR CHECKING AUTHENTICATION:', e);
          displayDiagnostic(`
            <h3>Erreur lors de la vérification de l'authentification:</h3>
            <p>${e.stack || e.message}</p>
          `);
        }
      }
      
      // Tenter de rendre un composant simple dans le DOM
      try {
        console.log("🔍 Attempting to render a test element...");
        const testElement = document.createElement('div');
        testElement.id = 'diagnostic-test-element';
        testElement.textContent = 'Test d\'affichage - Si vous voyez ce texte, le rendu DOM fonctionne.';
        testElement.style.position = 'fixed';
        testElement.style.top = '10px';
        testElement.style.right = '10px';
        testElement.style.background = 'lightgreen';
        testElement.style.padding = '5px';
        testElement.style.zIndex = '10000';
        testElement.style.borderRadius = '3px';
        
        document.body.appendChild(testElement);
        
        // Le supprimer après quelques secondes
        setTimeout(() => {
          if (testElement.parentNode) {
            testElement.parentNode.removeChild(testElement);
          }
        }, 5000);
        
        console.log("✅ Test element rendered successfully");
      } catch (e) {
        console.error('📛 ERROR RENDERING TEST ELEMENT:', e);
        displayDiagnostic(`
          <h3>Erreur lors du rendu d'un élément de test:</h3>
          <p>${e.stack || e.message}</p>
        `);
      }
    }, 1000);
    
    // Fonction pour afficher les diagnostics
    function displayDiagnostic(htmlContent) {
      let diagnosticContainer = document.getElementById('diagnostic-container');
      
      if (!diagnosticContainer) {
        diagnosticContainer = document.createElement('div');
        diagnosticContainer.id = 'diagnostic-container';
        diagnosticContainer.style.position = 'fixed';
        diagnosticContainer.style.top = '20px';
        diagnosticContainer.style.left = '20px';
        diagnosticContainer.style.right = '20px';
        diagnosticContainer.style.maxHeight = '80vh';
        diagnosticContainer.style.overflowY = 'auto';
        diagnosticContainer.style.background = '#fff';
        diagnosticContainer.style.border = '2px solid #f00';
        diagnosticContainer.style.borderRadius = '5px';
        diagnosticContainer.style.padding = '15px';
        diagnosticContainer.style.zIndex = '10000';
        diagnosticContainer.style.boxShadow = '0 0 20px rgba(255,0,0,0.5)';
        
        const header = document.createElement('div');
        header.innerHTML = `
          <h2 style="margin-top: 0; color: #d00;">Diagnostic d'Erreur LA MAMMA</h2>
          <p>Des problèmes ont été détectés. Consultez les informations ci-dessous pour résoudre le problème.</p>
          <button id="dismiss-diagnostic" style="position: absolute; top: 10px; right: 10px; cursor: pointer;">×</button>
        `;
        
        diagnosticContainer.appendChild(header);
        
        const content = document.createElement('div');
        content.id = 'diagnostic-content';
        diagnosticContainer.appendChild(content);
        
        document.body.appendChild(diagnosticContainer);
        
        // Ajouter l'écouteur de fermeture
        document.getElementById('dismiss-diagnostic').addEventListener('click', function() {
          diagnosticContainer.parentNode.removeChild(diagnosticContainer);
        });
      }
      
      // Ajouter le contenu
      const contentContainer = document.getElementById('diagnostic-content');
      const diagnosticEntry = document.createElement('div');
      diagnosticEntry.className = 'diagnostic-entry';
      diagnosticEntry.style.marginBottom = '15px';
      diagnosticEntry.style.paddingBottom = '15px';
      diagnosticEntry.style.borderBottom = '1px solid #ddd';
      diagnosticEntry.innerHTML = htmlContent;
      
      contentContainer.appendChild(diagnosticEntry);
    }
  })();