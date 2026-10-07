/** AfriGreen24 ESG -> HumbleOS Cloud bridge. Script Properties only:
 * HUMBLEOS_GATEWAY_URL and HUMBLEOS_GATEWAY_SECRET. */
function demarrerAnalyseHumbleOSESG_(profil, reponsesESG, reponsesDigitales, analyseESG, diagnosticDigitalPublic) {
  try {
    var p = PropertiesService.getScriptProperties();
    var baseUrl = String(p.getProperty("HUMBLEOS_GATEWAY_URL") || "").replace(/\/$/, "");
    var secret = String(p.getProperty("HUMBLEOS_GATEWAY_SECRET") || "");
    if (!baseUrl || !secret) throw new Error("Configuration HumbleOS ESG absente.");
    var response = UrlFetchApp.fetch(baseUrl + "/start-esg-report", {
      method: "post", contentType: "application/json",
      headers: { Authorization: "Bearer " + secret, "X-AfriGreen-Secret": secret },
      payload: JSON.stringify(construirePayloadHumbleOSESG_(profil, reponsesESG, reponsesDigitales, analyseESG, diagnosticDigitalPublic)),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 202) throw new Error("Démarrage HumbleOS ESG refusé (HTTP " + response.getResponseCode() + ").");
    var job = JSON.parse(response.getContentText());
    if (!job.success || !job.jobId) throw new Error("Réponse de démarrage HumbleOS ESG invalide.");
    return { success: true, jobId: job.jobId };
  } catch (e) { console.error("HumbleOS ESG non démarré : " + (e.message || e)); return { success: false }; }
}

function recupererAnalyseHumbleOSESG_(jobHumbleOS, recommandationsDeterministes) {
  if (!jobHumbleOS || !jobHumbleOS.success || !jobHumbleOS.jobId) return recommandationsDeterministes;
  try {
    var p = PropertiesService.getScriptProperties(); var baseUrl = String(p.getProperty("HUMBLEOS_GATEWAY_URL") || "").replace(/\/$/, ""); var secret = String(p.getProperty("HUMBLEOS_GATEWAY_SECRET") || "");
    for (var essai = 0; essai < 45; essai++) {
      Utilities.sleep(3000);
      var response = UrlFetchApp.fetch(baseUrl + "/esg-job?id=" + encodeURIComponent(jobHumbleOS.jobId), { method: "get", headers: { Authorization: "Bearer " + secret, "X-AfriGreen-Secret": secret }, muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) throw new Error("Lecture du job refusée (HTTP " + response.getResponseCode() + ").");
      var state = JSON.parse(response.getContentText());
      if (state.status === "FAILED") throw new Error(state.error || "Job HumbleOS ESG en échec.");
      if (state.status === "COMPLETED") return fusionnerRecommandationsHumbleOSESG_(recommandationsDeterministes, state.result && state.result.recommendations);
    }
    throw new Error("Délai HumbleOS ESG dépassé après environ 135 secondes.");
  } catch (e) { console.error("HumbleOS ESG indisponible ; recommandations déterministes conservées : " + (e.message || e)); return recommandationsDeterministes; }
}

function construirePayloadHumbleOSESG_(profil, reponsesESG, reponsesDigitales, analyseESG, diagnosticDigitalPublic) {
  var diagnostic = analyseESG.diagnostic || {}; var scores = diagnostic.scores || {};
  return { profile: selectionnerChampsHumbleOSESG_(profil || {}, ["organizationName", "mainCountry", "organizationType", "mainSector", "employeeCount", "annualRevenueOrBudget", "interventionZone", "existingESGPolicy", "existingESGReport", "diagnosticPurpose"]), esgAnswers: normaliserReponsesHumbleOSESG_(reponsesESG), digitalAnswers: normaliserReponsesHumbleOSESG_(reponsesDigitales), deterministicAnalysis: { scores: scores, maturite: diagnostic.maturite || scores.maturite, risque: diagnostic.risque || scores.risque, qualiteDonnees: scores.qualiteDonnees, niveauConfiance: scores.niveauConfiance, niveauPreuve: scores.scorePreuves, alertes: diagnostic.alertesAvancees || diagnostic.alertesCritiques || [] }, deterministicRecommendations: analyseESG.recommandations || {} };
}
function normaliserReponsesHumbleOSESG_(reponses) { var sortie = []; Object.keys(reponses || {}).forEach(function(id) { var r = reponses[id] || {}; sortie.push({ questionId: id, value: r.value, evidenceLevel: r.evidenceLevel, comment: r.comment }); }); return sortie; }
function selectionnerChampsHumbleOSESG_(source, champs) { var sortie = {}; champs.forEach(function(champ) { if (source[champ] !== undefined) sortie[champ] = source[champ]; }); return sortie; }
function fusionnerRecommandationsHumbleOSESG_(deterministes, enrichies) { if (!enrichies || typeof enrichies !== "object") throw new Error("Recommandations HumbleOS ESG invalides."); var champs = ["syntheseStrategique", "forces", "faiblesses", "prioritePrincipale", "planAction", "indicateursRecommandes", "conclusion", "messageFinanceur"]; var sortie = JSON.parse(JSON.stringify(deterministes)); champs.forEach(function(champ) { if (enrichies[champ] === undefined || enrichies[champ] === null) throw new Error("Champ HumbleOS ESG manquant : " + champ); sortie[champ] = enrichies[champ]; }); ["immediate_0_3_months", "short_term_3_6_months", "structural_6_24_months"].forEach(function(champ) { if (!Array.isArray((sortie.planAction || {})[champ])) throw new Error("Plan d'action HumbleOS ESG invalide : " + champ); }); return sortie; }

/* soumettreDiagnosticV2() : démarrer juste après les calculs déterministes,
 * puis appeler recupererAnalyseHumbleOSESG_ juste avant genererRapportESGV2(). */
