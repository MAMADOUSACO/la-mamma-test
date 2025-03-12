/**
 * Correctif temporaire pour les problèmes de namespace
 * Recherche et réassigne les vues qui pourraient être dans le mauvais espace de noms
 */

(function() {
    console.log("🔧 Applying namespace fixes...");
    
    // S'assurer que le namespace views existe
    window.views = window.views || {};
    
    // Chercher Dashboard et Login dans les différents namespaces possibles
    const namespacesToCheck = [
      window,
      window.components || {},
      window.components?.common || {},
      window.LaMamma || {}
    ];
    
    // Vues à rechercher
    const viewsToFix = ['Dashboard', 'Login'];
    
    // Parcourir les vues
    viewsToFix.forEach(viewName => {
      // Si la vue n'existe pas dans window.views
      if (!window.views[viewName]) {
        console.log(`🔍 Searching for missing view: ${viewName}`);
        
        // Chercher dans tous les namespaces possibles
        for (const namespace of namespacesToCheck) {
          if (namespace[viewName] && typeof namespace[viewName] === 'function') {
            console.log(`✅ Found ${viewName} in another namespace, fixing...`);
            window.views[viewName] = namespace[viewName];
            break;
          }
        }
        
        // Si toujours pas trouvé, essayer de vérifier par le constructeur name
        if (!window.views[viewName]) {
          Object.keys(window).forEach(key => {
            if (window[key] && 
                typeof window[key] === 'function' && 
                window[key].name === viewName) {
              console.log(`✅ Found ${viewName} as global function, fixing...`);
              window.views[viewName] = window[key];
            }
          });
        }
        
        // Vérifier si la correction a fonctionné
        if (window.views[viewName]) {
          console.log(`✅ Successfully fixed ${viewName}!`);
        } else {
          console.error(`❌ Could not find ${viewName} in any namespace.`);
        }
      } else {
        console.log(`✅ View ${viewName} already exists in correct namespace.`);
      }
    });
    
    // Créer une vue Emergency fallback en cas d'échec des corrections
    if (!window.views.Dashboard && !window.views.Login) {
      console.log("⚠️ Creating emergency fallback view");
      
      class EmergencyView {
        constructor() {
          console.log("📣 Emergency view created");
        }
        
        render() {
          const element = document.createElement('div');
          element.style.padding = '20px';
          element.style.maxWidth = '600px';
          element.style.margin = '40px auto';
          element.style.background = '#fff';
          element.style.border = '1px solid #ddd';
          element.style.borderRadius = '8px';
          element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          
          element.innerHTML = `
            <h1 style="color:#E74C3C;text-align:center;">LA MAMMA</h1>
            <div style="text-align:center;margin-bottom:30px;">
              <p>Problème détecté: Les vues Dashboard et Login n'ont pas été trouvées.</p>
            </div>
            <div>
              <h3>Debugging Information:</h3>
              <ul>
                <li>Les fichiers Dashboard.js et Login.js sont chargés mais n'exposent pas correctement leurs classes.</li>
                <li>Vérifiez que ces fichiers contiennent à la fin: <pre>window.views = window.views || {};\nwindow.views.Dashboard = Dashboard;</pre></li>
              </ul>
            </div>
            <div style="margin-top:30px;text-align:center;">
              <p>Cette vue d'urgence est affichée en attendant la résolution du problème.</p>
            </div>
          `;
          
          return element;
        }
        
        destroy() {
          // Rien à nettoyer
        }
      }
      
      // Enregistrer la vue d'urgence comme Dashboard et Login
      window.views.Dashboard = EmergencyView;
      window.views.Login = EmergencyView;
    }
  })();