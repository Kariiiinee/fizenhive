export const fr = {
    common: {
        portfolio: "Portfolio",
        analysis: "Analyse",
        screener: "Screener",
        aiAssistant: "Assistant IA",
        loading: "Chargement...",
        error: "Une erreur est survenue",
        save: "Enregistrer",
        saved: "Enregistré",
        downloadCsv: "Télécharger CSV",
        exportPdf: "Exporter en PDF",
        cancel: "Annuler",
        confirm: "Confirmer",
        search: "Rechercher...",
        back: "Retour",
        total: "Total",
    },
    header: {
        loggedInAs: "Connecté en tant que",
        signOut: "Déconnexion",
        signIn: "Connexion",
        navMenu: "Menu de navigation",
    },
    dashboard: {
        heroTitle: "Investissez avec clarté, simplement.",
        heroSubtitle: "Construisez, analysez et suivez votre portefeuille dans un seul espace.",
        invested: "Investi",
        current: "Actuel",
        roi: "ROI",
        return: "Rendement",
        addInvestment: "Ajouter un investissement",
        searchPlaceholder: "Rechercher pour ajouter (ex: AAPL)",
        targetPriceInfo: "Le prix cible est votre objectif de prix pour l'apprentissage.",
        mainPortfolio: "Portefeuille Principal",
        newTab: "Nouvel Onglet",
        portfolioNamePlaceholder: "Nom du portefeuille...",
        portfolioValue: "Valeur du Portefeuille",
        now: "Maintenant",
        emptyChart: "Ajoutez une position pour voir votre graphique de performance",
        scrollHint: "Faites glisser horizontalement pour voir plus de colonnes",
        portfolioReport: "Rapport de Portefeuille",
        table: {
            ticker: "Ticker",
            mthBought: "Mois Achat",
            qty: "Qté",
            avgCost: "Coût Moyen",
            totalInvested: "Total Investi",
            currentPrice: "Prix Actuel",
            currentValue: "Valeur Actuelle",
            currentRoi: "ROI Actuel %",
            totalRtn: "Rend. Total",
            targetPrice: "Prix Cible",
            targetRoi: "ROI Cible %",
            targetRtn: "Objectif Rend.",
        },
        loadingDashboard: "Chargement du tableau de bord...",
        loadingPortfolio: "Chargement du portefeuille...",
        noInvestments: "Aucun investissement ajouté pour le moment.",
        confirmDeletePortfolio: "Êtes-vous sûr de vouloir supprimer ce portefeuille et toutes ses positions ?",
    },
    analysis: {
        searchPlaceholder: "Recherchez un ticker ou une entreprise (ex: AAPL, LVMH)",
        fetchingData: "Récupération des données de marché...",
        noChartData: "Aucune donnée graphique disponible pour cette période.",
        insightsError: "Échec de la récupération des analyses IA.",
        networkError: "Erreur réseau. Veuillez réessayer.",
        aiAnalysisTitle: "Analyse de Valeur par IA",
        crunchingFundamentals: "Calcul des fondamentaux...",
        generateHelpText: "Générez une analyse approfondie par IA sur la valorisation et la qualité de cette action.",
        generateButton: "Générer l'Analyse",
        price: "Prix",
        aiAnalysis: "Analyse de Valeur par IA",
        crunching: "Calcul des fondamentaux...",
        intrinsicValue: "Valeur Intrinsèque",
        mos: "MOS",
        qualityScore: "Score de Qualité",
        takeaway: "Résumé",
        context: "Contexte",
        risks: "Risques Identifiés",
        identifiedRisks: "Risques Identifiés",
        heroTitle: "Découvrez la valeur intrinsèque, les scores de qualité et les risques cachés grâce à l'IA.",
        generateBtn: "Générer l'Analyse",
        keyStats: "Statistiques Clés",
        loadingMarketData: "Chargement des données de marché...",
        stats: {
            marketCap: {
                label: "Cap. Boursière",
                def: "Valeur totale de l'entreprise sur le marché. Donne une idée de la taille et de la stabilité."
            },
            peRatio: {
                label: "Ratio P/E",
                def: "Indique combien les investisseurs paient pour chaque 1$ de bénéfice."
            },
            revenueGrowth: {
                label: "Croissance Revenu",
                def: "Indique à quelle vitesse l'entreprise développe ses ventes au fil du temps."
            },
            profitMargin: {
                label: "Marge Bénéficiaire",
                def: "Pourcentage du chiffre d'affaires qui se transforme en profit."
            },
            debtToEquity: {
                label: "Dette sur Capitaux",
                def: "Montre le niveau d'endettement de l'entreprise par rapport à ses propres fonds."
            },
            dividendYield: {
                label: "Rend. Dividende",
                def: "Revenu versé aux actionnaires."
            },
            fiftyTwoWeekPriceChange: {
                label: "Var. sur 52 Sem.",
                def: "Performance de l'action au cours de l'année écoulée."
            },
            volume: {
                label: "Volume",
                def: "Nombre d'actions échangées sur une période donnée."
            }
        }
    },
    screener: {
        title: "Screener",
        subtitle: "Filtrage des meilleures entreprises par capitalisation boursière par région pour des résultats de qualité.",
        allSectors: "Tous les secteurs",
        results: "Résultats",
        sector: "Secteur",
        sendForAi: "Envoyer pour analyse IA",
        loadMore: "Charger plus de résultats",
        viewDetails: "Voir le détail du score",
        badges: {
            check: "VÉRIFIER",
            watch: "SURVEILLER",
            hold: "CONSERVER"
        },
        modal: {
            title: "Détail de l'Analyse",
            safetyScore: "Détail du Score de Sécurité",
            mispricingScore: "Détail du Score de Valorisation",
            newsSentiment: "Ajustement du Sentiment des Actualités",
            gotIt: "Compris",
            debtToEquityDef: "Plus bas est mieux. Les entreprises peu endettées sont plus résilientes.",
            currentRatioDef: "Test de liquidité. Au-dessus de 1,5 indique une bonne couverture à court terme.",
            fcfDef: "Un FCF positif montre que l'entreprise génère du cash réel.",
            peDef: "Multiple de valorisation. Un P/E bas suggère souvent une meilleure valeur.",
            upsideDef: "Rendement attendu selon les objectifs moyens des analystes.",
            roeDef: "Mesure d'efficacité. Au-dessus de 15% montre une excellente utilisation du capital.",
            newsPositive: "Catalyseurs positifs détectés dans les titres récents.",
            newsNegative: "Signaux d'actualités négatifs détectés.",
            newsNeutral: "Aucun mot-clé significatif détecté dans l'actualité."
        },
        regions: {
            us: "États-Unis",
            france: "France",
            germany: "Allemagne",
            china: "Chine",
            hongkong: "Hong Kong",
            japan: "Japon",
            singapore: "Singapour"
        },
        filters: {
            gainers: "Plus Fortes Hausses",
            losers: "Plus Fortes Baisses",
            active: "Les Plus Actifs",
            dividend: "Plus Hauts Dividendes",
            revenue: "Plus Forte Croissance Revenu",
            profit: "Plus Forte Marge",
            lowGainers: "Hausse sur Plus Bas 52S",
            pe: "Plus Bas Ratio P/E",
            marketCap: "Plus Grande Cap. Boursière",
            highGainers: "Hausse sur Plus Haut 52S"
        },
        sectors: {
            all: "Tous les secteurs",
            tech: "Technologie",
            finance: "Services Financiers",
            healthcare: "Santé",
            cyclical: "Consommation Cyclique",
            defensive: "Consommation Défensive",
            energy: "Énergie",
            industrials: "Industrie",
            materials: "Matériaux de Base",
            realestate: "Immobilier",
            utilities: "Services Publics",
            communication: "Services de Communication"
        },
        stats: {
            marketCap: "Cap. Boursière",
            volume: "Volume",
            pe: "P/E",
            dividend: "Div",
            revenueGrowth: "Croiss. Rev",
            profitMargin: "Marge",
            debtToEquity: "D/E",
            fiftyTwoWeekChange: "Var. 52S"
        },
        metrics: {
            debtToEquity: "Dette sur Capitaux",
            currentRatio: "Ratio de Liquidité",
            freeCashflow: "Flux de Trésorerie Libre",
            peRatio: "Ratio P/E",
            analystUpside: "Potentiel Analystes",
            roe: "Rendement des Capitaux (ROE)"
        }
    },
    chat: {
        welcome: "Bonjour ! Je suis l'IA FizenHive. Comment puis-je vous aider à analyser votre portefeuille ou les marchés aujourd'hui ?",
        inputPlaceholder: "Demandez n'importe quoi à Fizenhive...",
        disclaimer: "À des fins éducatives uniquement : En tant qu'IA FizenHive, je fournis des informations éducatives neutres. Je ne fournis pas de conseils en investissement.",
        online: "En ligne",
        error: "Désolé, j'ai du mal à me connecter à ma base de connaissances. Veuillez réessayer plus tard.",
        title: "IA FizenHive",
    },
    pwa: {
        install: "Installer l'App",
        tapShare: "Appuyez sur Partager",
        addToHome: "Ajouter à l'écran d'accueil",
        gotIt: "Compris"
    },
    limits: {
        analysis: {
            title: "Analyse IA Limitée",
            description: "Vous avez atteint votre limite d'analyses gratuites. Connectez-vous pour continuer à obtenir des insights financiers illimités."
        },
        screener: {
            title: "Screener Limité",
            description: "Explorez plus d'opportunités de marché en créant un compte. Les invités sont limités à 5 recherches par session."
        },
        chat: {
            title: "Chat IA Limité",
            description: "Votre conversation avec l'IA a atteint sa limite. Connectez-vous pour débloquer des discussions illimitées."
        },
        lab: {
            title: "Lab Limité",
            description: "Explorez plus d'opportunités de marché en créant un compte. Les invités sont limités à 5 scans par session."
        },
        loginButton: "Se connecter / Créer un compte",
        maybeLater: "Plus tard"
    },
    lab: {
        title: "Lab",
        subtitle: "Découvrir les tendances émergentes, les pépites small-cap et les changements structurels.",
        scanButton: "Lancer le Scan de Découverte",
        scanning: "Analyse du Marché...",
        lastScan: "Dernier Scan",
        sections: {
            smallCaps: {
                title: "Potentiel Caché Small-Cap",
                description: "Actions < 1Md$ avec une croissance accélérée et une trésorerie solide."
            },
            relativeOutliers: {
                title: "Outliers de Classement Relatif",
                description: "Top 10% des performances régionales basées sur la Valeur, Qualité et Croissance.",
                explanation: "Classé par analyse centile sur 6 indicateurs : EV/EBITDA, P/E, rendement FCF, croissance du chiffre d'affaires, ROIC/ROA et Dette/Capitaux propres."
            },
            curiosity: {
                title: "Radar de Curiosité",
                description: "Anomalies hebdomadaires : pics de volume, rotations extrêmes et outliers."
            },
            improvers: {
                title: "Plus Grosses Améliorations (Delta)",
                description: "Entreprises montrant la plus forte progression de score par rapport au scan précédent."
            },
            watchlist: {
                title: "Suivi de Watchlist",
                description: "Suivi persistant de vos intérêts découverts."
            }
        },
        metrics: {
            score: "Score",
            rank: "Rang",
            growth: "Croissance",
            stability: "Stabilité",
            improvement: "Amélioration",
            delta: "Delta"
        },
        noResults: "Aucune anomalie détectée. Essayez de lancer un nouveau scan."
    }
};
