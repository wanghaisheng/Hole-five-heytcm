# Landing Page Design Brief: Hole Wuxing

## 1. Project Overview
This document outlines the design and development strategy for the landing page of "Hole Wuxing," a puzzle adventure game based on the Chinese Five Elements (Wuxing) philosophy. The primary goals are to generate user interest, build trust for a new game and website, optimize for search engines (SEO), and drive conversions (leading players to the game).

## 2. Core Objectives
*   **SEO Trust (New Site):** Establish initial search engine visibility and trust through technical SEO, relevant content, and keyword optimization.
*   **User Interest & Trust (New Game):** Excite potential players about the game, build trust in the game and developers, and encourage them to play.
*   **High Conversion:** Maximize clicks on the "Play Now!" call-to-action, leading to `game.html`.

## 3. Target Audience
Players who enjoy casual puzzle games, strategy elements, and cultural themes. Likely interested in relaxing yet mentally stimulating gameplay.

## 4. Design & Content Strategy

### 4.1. Visual Design & Gamification
*   **Theme:** Mystical, enchanting, and aligned with the Wuxing elements. Colors will reflect the five elements (Gold, Green, Blue, Red, Yellow/Brown) alongside a primary palette (Dark Blue-Gray, Red-Orange, Yellow, Light Gray).
*   **Logo:** A stylized representation of the five elements in harmony.
*   **Hero Section:** Features a stunning background (`hero-bg.png`) depicting an elemental landscape, the game logo, an intriguing headline, and a clear call-to-action button.
*   **Gamified Elements:** Language used will be evocative. Icons and visuals will be game-themed. The friendly UFO from the game will be featured. New specific icons for "Play Anywhere" (`img/landing/feature-multiplatform.png`) and "Accessibility" (`img/landing/feature-accessibility.png`) sections are introduced.

### 4.2. Content Sections
*   **Header:** Logo, navigation (Features, How to Play, Gameplay, Community, FAQ), Language Switcher.
*   **Hero:** Headline, subtitle, main CTA ("Play Now!").
*   **Features:** Highlights core mechanics (Wuxing system, Puzzles, Collection) with icons and descriptions.
*   **How to Play:** Details the core gameplay loop (drag & group, match & fill, UFO collection, elemental powers) with illustrative icons and brief descriptions.
*   **Gameplay Showcase:** Placeholder for video/GIFs, emphasizing visual appeal.
*   **Developer Passion:** A short, sincere message from the developers to build connection and trust, featuring the game's UFO mascot.
*   **The World of Wuxing:** Explains the Wuxing philosophy and its integration into the game, enhancing thematic depth and cultural appeal. Includes a visual diagram of Wuxing cycles.
*   **Play Anywhere:** Highlights the game's web-based accessibility, requiring no downloads. Features a new, specific icon (`img/landing/feature-multiplatform.png`).
*   **Accessibility Features:** Details features designed for broader player enjoyment. Features a new, specific icon (`img/landing/feature-accessibility.png`).
*   **Sound & Music Teaser:** Hints at the game's immersive audio experience.
*   **Stay Updated (New Section):** A brief section to build anticipation for future developments and encourage community following. Uses an existing icon (e.g., UFO).
*   **Community:** Links to social platforms (Discord, X - marked as "Coming Soon") and a general encouragement.
*   **FAQ (Frequently Asked Questions):** Addresses common player questions.
*   **Footer:** Copyright, Privacy Policy, Terms of Service, Contact links.

### 4.3. Call to Action (CTA)
*   **Primary CTA:** "Play Now!" button prominently displayed in the hero section, linking to `game.html`.
*   **Secondary CTAs:** Links to community platforms.

## 5. SEO Strategy (New Site Focus)
*   **Keywords:** "Wuxing game", "five elements puzzle", "elemental strategy game", "puzzle adventure", "五行游戏", "元素解谜", "how to play Wuxing game", "free puzzle game", "browser game", "accessible puzzle game", "Wuxing game updates".
*   **On-Page SEO:**
    *   **Semantic HTML5:** Use of `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`.
    *   **Heading Structure:** Logical H1-H6 hierarchy. H1 for main headline. New "Stay Updated" section will have an H2.
    *   **Meta Tags:**
        *   `<title>`: Dynamic, keyword-rich, and engaging.
        *   `<meta name="description">`: Compelling summary with keywords.
        *   Both `title` and `description` internationalized via `data-i18n`.
    *   **Image SEO:** Optimized images (compression, modern formats), descriptive `alt` text (internationalized via `data-i18n-attr`). This applies to new icons for Play Anywhere, Accessibility, and the icon used in "Stay Updated".
    *   **Schema.org:** `VideoGame` schema implemented in JSON-LD. Publisher name is now internationalized.
    *   **Content Relevance:** Content focused on game features, Wuxing theme, puzzle-solving, accessibility, and now future updates.
*   **Technical SEO:**
    *   **Mobile-First Responsive Design.**
    *   **Page Speed:** Clean code, optimized images.
    *   **Crawlability:** Clear navigation and internal linking.
*   **New Site Trust:**
    *   "Developer Passion" and "Stay Updated" sections enhance trust.
    *   "The World of Wuxing", "Play Anywhere", "Accessibility Features", "FAQ" address user concerns.
    *   Links to Privacy Policy and Terms of Service.

## 6. User Trust Building Strategy
*   **Transparency:** Clear information about game mechanics, developer's vision, accessibility, sound design, and now future plans via "Stay Updated".
*   **Gameplay Showcase:** (Placeholder) Visual evidence.
*   **Community Building:** Encouraging users to join platforms.
*   **Professional Design:** Clean, well-structured, visually appealing.
*   **Educational Content:** "The World of Wuxing".
*   **Problem Solving:** "FAQ".
*   **Inclusivity:** "Accessibility Features".
*   **Compliance:** Links to Privacy Policy and Terms of Service.

## 7. Internationalization (i18n) Strategy
*   **JSON-driven:** `locale/en.json` and `locale/zh.json` files store all translatable strings, including for new icons' alt text, the "Stay Updated" section, and the publisher's name in Schema.org.
*   **`data-i18n` Attributes:** For all user-visible text.
*   **`data-i18n-attr` Attributes:** For HTML attributes.
*   **JavaScript Logic (`js/landing.js`):**
    *   Detects language, provides switcher.
    *   Fetches JSON, updates content and attributes.
    *   Updates `document.documentElement.lang`.
    *   Updates Schema.org `name`, `description`, and `publisher.name`.
*   **Image/Asset Localization:** Text within images is avoided. New icons are purely visual.

## 8. Technology Stack
*   HTML5
*   CSS3
*   JavaScript (Vanilla JS)

## 9. File Structure