# Sources de donnees — Plateforme donnees Quebec

## donneesquebec.ca

1,583 datasets, licence CC-BY 4.0, formats CSV/GeoJSON/SHP/XLSX

| Categorie | Nb datasets | Exemples |
|---|---|---|
| Environnement, ressources naturelles | 461 | Qualite eau, forets, mines, terrains contamines |
| Infrastructures | 379 | Ponts, routes, batiments publics, egouts |
| Gouvernement et finances | 268 | Budgets, depenses, contrats publics |
| Transport | 212 | Conditions routieres, entraves, stationnement |
| Loi, justice, securite | 162 | Actes criminels, tribunaux, inspections |
| Societe et culture | 143 | Demographie, education, immigration |
| Tourisme, sports, loisirs | 121 | Sentiers, parcs, evenements, patrimoine |
| Politiques sociales | 90 | Logement, aide sociale |
| Sante | 68 | Urgences, inspections MAPAQ, cliniques |
| Economie et entreprises | 44 | Registre entreprises, RENA, emploi |

**Organisations majeures** : Ville de Montreal (383), Ville de Laval (133), Min. Environnement (118), Min. Ressources naturelles (117)

---

## Datasets critiques par outil

### Immobilier (8 outils)

| Dataset | Format | Outils | Lien |
|---|---|---|---|
| Zones inondables | GeoJSON/SHP | FloodCheck, ClimatRisk, PropTech | donneesquebec.ca |
| Terrains contamines | CSV/GeoJSON | TerraCheck, PropTech | MELCCFP |
| Evaluation fonciere | CSV | ProspectImmo, ImmoTax, PropTech, FoncierFlip | Roles municipaux |
| Zonage municipal | GeoJSON | ZonageExpress, PropTech, PermisBot | Villes individuelles |
| Permis de construction | CSV | AlertePermis, RenoPrix, PermisTracker | Montreal, Laval, Quebec |
| Cadastre | SHP | PlotBook, VacantWatch | MRNF |
| Taxes municipales | CSV | ImmoTax, TaxeAlert | Villes |
| Inspections salubrite | CSV | LouerSmart | Montreal, Quebec |

### Entrepreneurs et PME (5 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Registre RBQ | Web/API | ContractorCheck | rbq.gouv.qc.ca |
| REQ (registre entreprises) | API | LeadGen, BizObitu, BidWatch | registreentreprises.gouv.qc.ca |
| RENA (sanctions) | CSV | BidWatch, ContractorCheck | donneesquebec.ca |
| Contrats publics (SEAO) | API | BidWatch, VeilleContrats | seao.ca |
| CNESST inspections | CSV | CNESST Scout, SafeWork | donneesquebec.ca |

### Familles et education (4 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Garderies/CPE | CSV | GarderieFind | MFA |
| Ecoles | CSV | ClasseScore, SchoolBus | CSS |
| Actes criminels | GeoJSON | SafeRoute, CrimMap | SPVM, SQ |
| Transport scolaire | — | SchoolBus | CSS |

### Emploi et salaires (3 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Enquete salaires | CSV | SalaireLab | Emploi Quebec |
| Offres d'emploi | API | JobMap, SalaireLab | Emploi Quebec |
| Enquete Relance | CSV | CampusCompare | MEES |

### Ressources naturelles (4 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Sites miniers | GeoJSON | MineSite | MRNF |
| Coupes forestieres | SHP | ForetPro | MFFP |
| Statistiques chasse | CSV | ChassePeche | MFFP |
| Depots agregats | GeoJSON | GravelMap | MRNF |

### Agriculture (3 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Inspections MAPAQ | CSV | InspectoMap, FermeAudit | MAPAQ |
| Terres agricoles | SHP | AgroMap | CPTAQ |
| Agrotourisme | CSV | LocalFood | MAPAQ |

### Environnement (3 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Qualite eau | CSV | WaterWatch | MELCCFP |
| Feux de foret | GeoJSON | ClimatRisk, ForetPro | SOPFEU |
| Canopee urbaine | GeoJSON | ArbreQC, TreePlant | Villes |

### Gouvernement (3 outils)

| Dataset | Format | Outils | Source |
|---|---|---|---|
| Budgets municipaux | CSV | MuniDash, ContratWatch | Villes |
| Reglements municipaux | PDF/web | GovBot, PermisBot, DocuMuni | Villes |
| Elections | CSV | ElectoMap | DGEQ |

---

## Data Engine : pipeline de donnees

### Frequence de mise a jour

| Categorie | Frequence | Raison |
|---|---|---|
| Permis de construction | Quotidien | Nouveaux permis chaque jour |
| Evaluations foncieres | Annuel | Mise a jour 1x/an par ville |
| Zones inondables | Mensuel | Change rarement |
| Terrains contamines | Hebdomadaire | Nouvelles decouvertes |
| Actes criminels | Quotidien | Donnees jour precedent |
| Inspections MAPAQ | Hebdomadaire | Nouvelles inspections |
| Salaires | Trimestriel | Enquetes periodiques |
| Garderies/CPE | Quotidien | Places changent chaque jour |
| REQ | Quotidien | Nouvelles immatriculations |

### Format de stockage

- **GeoJSON/SHP** → PostGIS GEOMETRY (requetes spatiales)
- **CSV/XLSX** → Tables PostgreSQL (requetes SQL standard)
- **PDF** → Parse + extraction texte → JSONB
- **API** → Fetch direct + cache Redis

### Gestion des erreurs

```
Dataset fetch
  → Success → Upsert DB → Log success
  → Fail (404) → Log warning → Retry dans 1h
  → Fail (parse error) → Log error → Alerte email → Skip
  → Fail 3x consecutives → Alerte urgente → Desactiver le dataset
```

---

## APIs externes (non donneesquebec)

| Source | Usage | Acces | Cout |
|---|---|---|---|
| RBQ (rbq.gouv.qc.ca) | Verification entrepreneurs | Scraping/API non-officielle | Gratuit |
| REQ (registreentreprises.gouv.qc.ca) | Info entreprises | API publique | Gratuit |
| SEAO (seao.ca) | Contrats publics | API publique | Gratuit |
| Google Maps API | Geocoding, Places | API key | Gratuit < 28K loads/mois |
| Nominatim (OSM) | Geocoding backup | API ouverte | Gratuit (rate limited) |
| Stats Canada | Recensement, demographie | API publique | Gratuit |
| CanLII | Decisions juridiques | API | Gratuit |
| SAAQ | Vehicules (si accessible) | A verifier | A verifier |

---

## Licence et droits

- **donneesquebec.ca** : CC-BY 4.0 (libre d'utiliser commercialement, citation requise)
- **Villes** : generalement licence ouverte similaire
- **Federal** : Open Government Licence (libre d'utiliser)
- **Obligation** : mentionner la source dans un footer ou page "Sources"
- **Interdiction** : aucune — utilisation commerciale explicitement permise
