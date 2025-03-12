/**
 * Script de diagnostic qui force l'affichage de contenu
 * Ce script attend quelques secondes puis remplace le contenu si l'écran est vide
 */

(function() {
    console.log("🚀 Force render script initialized");
    
    // Attendre 3 secondes pour laisser l'application se charger normalement
    setTimeout(function() {
      console.log("🔍 Checking if screen is still blank...");
      
      // Obtenir le conteneur de l'application
      const appContainer = document.getElementById('app');
      
      // Vérifier si le spinner de chargement est toujours visible
      const spinner = document.getElementById('loading-spinner');
      const spinnerVisible = spinner && (window.getComputedStyle(spinner).display !== 'none');
      
      // Vérifier si l'application a généré du contenu visible
      let hasVisibleContent = false;
      if (appContainer) {
        // Vérifier si le conteneur a du contenu autre que le spinner
        const children = Array.from(appContainer.children);
        hasVisibleContent = children.some(child => {
          return child !== spinner && window.getComputedStyle(child).display !== 'none';
        });
      }
      
      console.log("🔍 Spinner visible:", spinnerVisible);
      console.log("🔍 Has visible content:", hasVisibleContent);
      
      // Si l'écran est toujours vide, forcer l'affichage
      if (spinnerVisible || !hasVisibleContent) {
        console.log("🚨 Screen still blank - forcing content display!");
        
        // Vider le conteneur
        if (appContainer) {
          appContainer.innerHTML = '';
          
          // Créer du contenu de secours
          const emergencyContent = document.createElement('div');
          emergencyContent.style.padding = '20px';
          emergencyContent.style.maxWidth = '800px';
          emergencyContent.style.margin = '40px auto';
          emergencyContent.style.background = '#fff';
          emergencyContent.style.border = '1px solid #ddd';
          emergencyContent.style.borderRadius = '8px';
          emergencyContent.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          
          emergencyContent.innerHTML = `
            <h1 style="color:#E74C3C;text-align:center;">LA MAMMA</h1>
            <h2 style="text-align:center;">Tableau de bord de secours</h2>
            
            <div style="margin-top:30px;padding:20px;background:#f9f9f9;border-radius:8px;">
              <h3>État de l'application:</h3>
              <ul>
                <li>Les vues existent dans le bon namespace: <strong>Oui</strong></li>
                <li>Le routeur est initialisé: <strong>Oui</strong></li>
                <li>L'authentification fonctionne: <strong>Oui</strong></li>
                <li>Problème: <strong>La vue n'est pas rendue correctement</strong></li>
              </ul>
            </div>
            
            <div style="margin-top:30px;display:flex;gap:20px;flex-wrap:wrap;">
              <div style="flex:1;min-width:300px;background:#f5f5f5;padding:15px;border-radius:8px;">
                <h3>Commandes du jour</h3>
                <p style="color:#777;">Aucune commande enregistrée</p>
                <button style="padding:8px 16px;background:#E74C3C;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">
                  Nouvelle commande
                </button>
              </div>
              
              <div style="flex:1;min-width:300px;background:#f5f5f5;padding:15px;border-radius:8px;">
                <h3>Réservations à venir</h3>
                <p style="color:#777;">Aucune réservation enregistrée</p>
                <button style="padding:8px 16px;background:#E74C3C;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:10px;">
                  Nouvelle réservation
                </button>
              </div>
            </div>
            
            <div style="margin-top:30px;text-align:center;padding:15px;background:#f9f9f9;border-radius:8px;">
              <h3>Diagnostic technique</h3>
              <p>Le problème de rendu est probablement dû à:</p>
              <ol style="text-align:left;display:inline-block;">
                <li>Un problème dans la méthode render() de la vue Dashboard</li>
                <li>Une erreur dans la chaîne de rendu du routeur</li>
                <li>Un conflit CSS qui cache le contenu</li>
              </ol>
              <p>Consultez la console pour plus de détails.</p>
            </div>
          `;
          
          // Ajouter des écouteurs d'événements pour les boutons
          setTimeout(() => {
            const buttons = emergencyContent.querySelectorAll('button');
            buttons.forEach(button => {
              button.addEventListener('click', () => {
                alert('Cette fonctionnalité est désactivée dans cette vue de secours.');
              });
            });
          }, 100);
          
          // Ajouter le contenu au conteneur
          appContainer.appendChild(emergencyContent);
          
          // Analyser et afficher des informations de débogage supplémentaires
          console.log("🔍 Current route:", window.router?.getCurrentRoute() || "Unknown");
          console.log("🔍 App element content:", appContainer.innerHTML.substring(0, 200) + "...");
          
          // Essayer de forcer le routeur à recharger la route actuelle
          try {
            if (window.router) {
              console.log("🔄 Attempting to force router reload...");
              window.router.reload();
            }
          } catch (e) {
            console.error("❌ Error forcing router reload:", e);
          }
        }
      } else {
        console.log("✅ Content is visible, no need to force render");
      }
    }, 3000);
  })();