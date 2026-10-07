/**
 * ============================================================
 * AFRIGREEN24 — ESG SMART IMPORT
 * Fichier : ESGCanonicalNormalizer.gs
 * Version : 1.0.0
 * ============================================================
 *
 * Normalisation déterministe des valeurs extraites
 * vers les valeurs canoniques du questionnaire ESG.
 *
 * IMPORTANT :
 * - aucun appel HumbleOS ;
 * - aucun scoring ;
 * - aucune génération de rapport ;
 * - aucune invention ;
 * - en cas d'ambiguïté => null.
 */


/**
 * Normalise un texte pour permettre les comparaisons.
 */
function nettoyerTexteNormalisationESG_(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/**
 * Retourne une valeur déjà canonique sans la modifier.
 */
function normaliserValeurCanoniqueDirecteESG_(value) {
  if (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  ) {
    return value;
  }

  var texte =
    String(
      value === null ||
      value === undefined
        ? ""
        : value
    ).trim();

  if (/^[0-5]$/.test(texte)) {
    return Number(texte);
  }

  var upper =
    texte.toUpperCase();

  if (
    upper === "NA" ||
    upper === "UNK" ||
    upper === "WIP"
  ) {
    return upper;
  }

  return null;
}


/**
 * Transforme une formulation humaine en valeur canonique ESG.
 *
 * Retour :
 * 0..5 / NA / UNK / WIP
 *
 * null signifie :
 * la fonction ne possède pas assez d'information
 * pour décider de manière déterministe.
 */
function normaliserValeurCanoniqueImportESG_(value) {

  var directe =
    normaliserValeurCanoniqueDirecteESG_(
      value
    );

  if (directe !== null) {
    return directe;
  }

  var texte =
    nettoyerTexteNormalisationESG_(
      value
    );

  if (!texte) {
    return null;
  }


  /*
   * ==========================================================
   * NON APPLICABLE
   * ==========================================================
   */

  if (
    /\bnon applicable\b/.test(texte) ||
    /\bsans objet\b/.test(texte) ||
    /\bne s applique pas\b/.test(texte) ||
    /\bpas applicable\b/.test(texte) ||
    /\bnon pertinent pour (nos|les|l) activites\b/.test(texte)
  ) {
    return "NA";
  }


  /*
   * ==========================================================
   * INFORMATION INCONNUE
   * ==========================================================
   */

  if (
    /\binformation inconnue\b/.test(texte) ||
    /\binformation non disponible\b/.test(texte) ||
    /\bdonnee inconnue\b/.test(texte) ||
    /\bdonnee non disponible\b/.test(texte) ||
    /\bnous ne savons pas\b/.test(texte) ||
    /\bje ne sais pas\b/.test(texte) ||
    /\binconnu\b/.test(texte)
  ) {
    return "UNK";
  }


  /*
   * ==========================================================
   * EN COURS
   * ==========================================================
   */

  if (
    /\ben cours de mise en place\b/.test(texte) ||
    /\ben cours de preparation\b/.test(texte) ||
    /\ben cours de formalisation\b/.test(texte) ||
    /\ben cours de developpement\b/.test(texte) ||
    /\ben cours d elaboration\b/.test(texte) ||
    /\bactuellement en preparation\b/.test(texte) ||
    /\bactuellement en developpement\b/.test(texte)
  ) {
    return "WIP";
  }


  /*
   * ==========================================================
   * 0 — INEXISTANT
   * ==========================================================
   */

  if (
    /\binexistant\b/.test(texte) ||
    /\baucun dispositif\b/.test(texte) ||
    /\baucune pratique\b/.test(texte) ||
    /\baucune politique\b/.test(texte) ||
    /\baucune procedure\b/.test(texte) ||
    /\baucun systeme\b/.test(texte) ||
    /\brien n est en place\b/.test(texte) ||
    /\bpas de dispositif\b/.test(texte) ||
    /\bpas de politique\b/.test(texte) ||
    /\bpas de procedure\b/.test(texte) ||
    /\bpas de systeme\b/.test(texte)
  ) {
    return 0;
  }


  /*
   * ==========================================================
   * 1 — INFORMEL
   * ==========================================================
   */

  if (
    /\binformel\b/.test(texte) ||
    /\bpratique informelle\b/.test(texte) ||
    /\bpratiques informelles\b/.test(texte) ||
    /\bnon documente\b/.test(texte) ||
    /\bnon formalise\b/.test(texte) ||
    /\bponctuel\b/.test(texte) ||
    /\bponctuelle\b/.test(texte) ||
    /\boccasionnel\b/.test(texte) ||
    /\boccasionnelle\b/.test(texte)
  ) {
    return 1;
  }


  /*
   * ==========================================================
   * 2 — INITIÉ
   * ==========================================================
   */

  if (
    /\binitie\b/.test(texte) ||
    /\bpremieres initiatives\b/.test(texte) ||
    /\bquelques initiatives\b/.test(texte) ||
    /\binitiatives isolees\b/.test(texte) ||
    /\bquelques actions\b/.test(texte) ||
    /\bpremieres actions\b/.test(texte) ||
    /\bdebut de mise en oeuvre\b/.test(texte)
  ) {
    return 2;
  }


  /*
   * ==========================================================
   * 3 — DÉFINI
   * ==========================================================
   */

  if (
    /\bdefini\b/.test(texte) ||
    /\bformalise\b/.test(texte) ||
    /\bstructure partiellement\b/.test(texte) ||
    /\bpartiellement structure\b/.test(texte) ||
    /\bprocedure formalisee\b/.test(texte) ||
    /\bpolitique formalisee\b/.test(texte) ||
    /\bprocessus defini\b/.test(texte) ||
    /\bdispositif defini\b/.test(texte)
  ) {
    return 3;
  }


  /*
   * ==========================================================
   * 4 — MESURÉ ET PILOTÉ
   * ==========================================================
   */

  if (
    /\bmesure et pilote\b/.test(texte) ||
    /\bmesuree et pilotee\b/.test(texte) ||
    /\bmesure regulierement\b/.test(texte) ||
    /\bmesuree regulierement\b/.test(texte) ||
    /\bsuivi regulierement\b/.test(texte) ||
    /\bsuivie regulierement\b/.test(texte) ||
    /\bindicateurs suivis\b/.test(texte) ||
    /\bindicateurs mesures\b/.test(texte) ||
    /\btableau de bord\b/.test(texte) ||
    /\bsysteme structure applique et suivi\b/.test(texte)
  ) {
    return 4;
  }


  /*
   * ==========================================================
   * 5 — MATURE ET AMÉLIORÉ
   * ==========================================================
   */

  if (
    /\bmature et ameliore\b/.test(texte) ||
    /\bmature et amelioree\b/.test(texte) ||
    /\bamelioration continue\b/.test(texte) ||
    /\bcontinuellement ameliore\b/.test(texte) ||
    /\bcontinuellement amelioree\b/.test(texte) ||
    /\brevu et ameliore regulierement\b/.test(texte) ||
    /\brevue et amelioree regulierement\b/.test(texte) ||
    /\bsysteme documente mesure et continuellement ameliore\b/.test(texte)
  ) {
    return 5;
  }


  /*
   * Aucune décision forcée.
   */
  return null;
}


/**
 * ============================================================
 * MICRO-TEST LOCAL
 * AUCUN HUMBLEOS
 * AUCUN WORKERS AI
 * ============================================================
 */
function TEST_ESG_NORMALISATION_CANONIQUE_LOCALE() {

  var tests = [

    [0, 0],
    ["0", 0],
    ["Inexistant", 0],
    ["Aucune politique environnementale", 0],
    ["Aucun dispositif", 0],

    [1, 1],
    ["1", 1],
    ["Informel", 1],
    ["Pratiques informelles", 1],
    ["Dispositif non documenté", 1],

    [2, 2],
    ["2", 2],
    ["Initié", 2],
    ["Quelques initiatives existent", 2],
    ["Premières actions lancées", 2],

    [3, 3],
    ["3", 3],
    ["Défini", 3],
    ["Politique formalisée", 3],
    ["Processus défini", 3],

    [4, 4],
    ["4", 4],
    ["Mesuré et piloté", 4],
    ["Indicateurs suivis régulièrement", 4],
    ["Tableau de bord environnemental", 4],

    [5, 5],
    ["5", 5],
    ["Mature et amélioré", 5],
    ["Système documenté, mesuré et continuellement amélioré", 5],
    ["Amélioration continue", 5],

    ["NA", "NA"],
    ["Non applicable", "NA"],
    ["Sans objet", "NA"],

    ["UNK", "UNK"],
    ["Information inconnue", "UNK"],
    ["Information non disponible", "UNK"],

    ["WIP", "WIP"],
    ["En cours de mise en place", "WIP"],
    ["En cours de formalisation", "WIP"],

    ["Une politique pourrait exister", null],
    ["Probablement structuré", null],
    ["Oui", null]
  ];

  var errors = [];

  tests.forEach(function(test, index) {

    var input =
      test[0];

    var expected =
      test[1];

    var output =
      normaliserValeurCanoniqueImportESG_(
        input
      );

    var ok =
      output === expected;

    Logger.log(
      JSON.stringify({
        test:
          index + 1,

        input:
          input,

        output:
          output,

        expected:
          expected,

        ok:
          ok
      })
    );

    if (!ok) {
      errors.push({
        input:
          input,

        output:
          output,

        expected:
          expected
      });
    }
  });


  Logger.log(
    "========================================"
  );

  Logger.log(
    "TESTS : " +
    tests.length
  );

  Logger.log(
    "OK : " +
    (
      tests.length -
      errors.length
    )
  );

  Logger.log(
    "ERREURS : " +
    errors.length
  );

  Logger.log(
    "========================================"
  );


  if (errors.length > 0) {
    throw new Error(
      "TEST ESG NORMALISATION ÉCHOUÉ : " +
      JSON.stringify(errors)
    );
  }


  Logger.log(
    "✅ NORMALISATION CANONIQUE ESG VALIDÉE"
  );

  return {
    success: true,

    tests:
      tests.length,

    ok:
      tests.length,

    errors: 0
  };
}