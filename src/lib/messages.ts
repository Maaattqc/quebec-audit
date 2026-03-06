import type { Business } from "./types";

export function generateEmail(b: Business): string {
  return `Bonjour,

Je me permets de vous contacter car j'ai analysé votre site web (${b.url}) et j'ai identifié des améliorations concrètes qui pourraient vous aider à attirer plus de clients.

Points observés :
${b.issues.slice(0, 3).map((i) => `• ${i}`).join("\n")}

Solutions proposées :
${b.improvements.slice(0, 3).map((i) => `• ${i}`).join("\n")}

Investissement estimé : ${b.estimatedValue}
${b.hasDemo ? "\nJ'ai préparé une maquette gratuite de votre nouveau site pour vous montrer le potentiel. Je peux vous l'envoyer par courriel ou vous la présenter en personne.\n" : ""}
Seriez-vous disponible pour un appel de 15 minutes cette semaine ?

Cordialement,
[Votre nom]
[Votre téléphone]`;
}

export function generateSMS(b: Business): string {
  return `Bonjour! J'ai analysé votre site ${b.url} et trouvé des améliorations concrètes pour attirer plus de clients. ${b.hasDemo ? "J'ai même préparé une maquette gratuite! " : ""}Estimation: ${b.estimatedValue}. Intéressé? [Votre nom]`;
}

export function generateFollowUp(b: Business): string {
  return `Bonjour,

Je fais suite à mon message précédent concernant votre site web. ${b.hasDemo ? "La maquette que j'ai préparée pour vous est toujours disponible — elle montre concrètement à quoi pourrait ressembler votre nouveau site.\n\n" : ""}Je comprends que vous êtes occupé, mais je crois vraiment que ces améliorations pourraient faire une différence pour votre entreprise.

Je suis disponible quand ça vous convient.

Cordialement,
[Votre nom]`;
}
