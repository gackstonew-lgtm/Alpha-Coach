export interface VoiceParsedSuggestion {
  setupName?: string;
  bias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confluences: string[];
  entryTrigger?: string;
  exitTrigger?: string;
  emotionState?: string;
  mistakeTag?: string;
  summaryNotes: string;
}

export class VoiceJournalService {
  /**
   * Parses natural language trading voice transcription into suggested structured journal fields.
   * NOTE: The user MUST confirm these suggested fields before they are saved to the database.
   */
  public static parseVoiceTranscript(transcript: string): VoiceParsedSuggestion {
    const text = transcript.toLowerCase();
    const confluences: string[] = [];

    // Detect Bias
    let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (text.includes('bullish') || text.includes('buy') || text.includes('long') || text.includes('higher')) {
      bias = 'BULLISH';
    } else if (text.includes('bearish') || text.includes('sell') || text.includes('short') || text.includes('lower')) {
      bias = 'BEARISH';
    }

    // Detect Common Setup / Confluences
    if (text.includes('liquidity sweep') || text.includes('sweep') || text.includes('swept')) {
      confluences.push('Liquidity Sweep');
    }
    if (text.includes('mss') || text.includes('market structure shift') || text.includes('structure shift') || text.includes('bos') || text.includes('break of structure')) {
      confluences.push('Market Structure Shift (MSS)');
    }
    if (text.includes('fvg') || text.includes('fair value gap') || text.includes('imbalance')) {
      confluences.push('Fair Value Gap (FVG)');
    }
    if (text.includes('order block') || text.includes('ob') || text.includes('block')) {
      confluences.push('Order Block');
    }
    if (text.includes('breaker') || text.includes('breaker block')) {
      confluences.push('Breaker Block');
    }
    if (text.includes('ifvg') || text.includes('inversion fvg')) {
      confluences.push('Inversion FVG (IFVG)');
    }
    if (text.includes('asian high') || text.includes('asian low') || text.includes('asia range')) {
      confluences.push('Asia Range Raid');
    }
    if (text.includes('breakout') || text.includes('retest')) {
      confluences.push('Break & Retest');
    }

    // Setup Name Suggestion
    let setupName = 'Discretionary Setup';
    if (confluences.length >= 2) {
      setupName = confluences.slice(0, 3).join(' + ');
    } else if (confluences.length === 1) {
      setupName = confluences[0];
    }

    // Entry & Exit trigger detection
    let entryTrigger = 'Standard Confluence Entry';
    if (text.includes('5m fvg') || text.includes('1m fvg')) {
      entryTrigger = 'Lower Timeframe FVG Tap';
    } else if (text.includes('rejection') || text.includes('wick')) {
      entryTrigger = 'Candlestick Wick Rejection';
    } else if (text.includes('market open') || text.includes('london open')) {
      entryTrigger = 'Session Open Impulse';
    }

    // Emotion / Mistake detection
    let emotionState = 'DISCIPLINED';
    let mistakeTag: string | undefined = undefined;

    if (text.includes('fomo') || text.includes('chased') || text.includes('rushed')) {
      emotionState = 'FOMO';
      mistakeTag = 'FOMO Entry';
    } else if (text.includes('revenge') || text.includes('frustrated') || text.includes('angry')) {
      emotionState = 'ANXIOUS';
      mistakeTag = 'Revenge Trading';
    } else if (text.includes('early') || text.includes('jumped the gun') || text.includes('impatient')) {
      emotionState = 'ANXIOUS';
      mistakeTag = 'Impatience / Early Entry';
    } else if (text.includes('fear') || text.includes('scared') || text.includes('cut early')) {
      emotionState = 'FEARFUL';
      mistakeTag = 'Early Exit / Cut Winner';
    }

    return {
      setupName,
      bias,
      confluences,
      entryTrigger,
      exitTrigger: 'Target Level Hit',
      emotionState,
      mistakeTag,
      summaryNotes: transcript.trim()
    };
  }
}
