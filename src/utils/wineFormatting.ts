import type { Wine } from '../types';

/**
 * Format wines as markdown bullet points for chat display
 */
export function formatWinesAsMarkdown(wines: Wine[]): string {
  if (wines.length === 0) {
    return 'No wines found.';
  }

  let markdown = '## Wine List Analysis\n\n';
  
  wines.forEach((wine, index) => {
    markdown += `• **${wine.displayName}${wine.vintage ? ` (${wine.vintage})` : ''}**\n`;
    
    markdown += `  - Restaurant Price: $${wine.restaurantPrice.toFixed(2)}\n`;
    
    if (wine.realPrice) {
      markdown += `  - Market Price: $${wine.realPrice.toFixed(2)}\n`;
      if (wine.markup !== undefined) {
        const markupSign = wine.markup > 0 ? '+' : '';
        markdown += `  - Markup: ${markupSign}${wine.markup.toFixed(1)}%\n`;
      }
    } else if (wine.webSearchPrice) {
      markdown += `  - Est. Market Price: $${wine.webSearchPrice.toFixed(2)}`;
      if (wine.webSearchSource) {
        markdown += ` (${wine.webSearchSource})`;
      }
      markdown += '\n';
    }
    
    if (wine.criticScore) {
      markdown += `  - Avg. Critic Score: ${wine.criticScore}/100\n`;
    }
    
    if (wine.varietal) {
      markdown += `  - Varietal: ${wine.varietal}\n`;
    }
    
    if (wine.region) {
      markdown += `  - Region: ${wine.region}\n`;
    }
    
    // Add spacing between wines (except last one)
    if (index < wines.length - 1) {
      markdown += '\n';
    }
  });

  return markdown;
}





