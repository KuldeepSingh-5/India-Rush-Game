import './style.css';

import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { createGame } from './config.js';

async function startAdMob() {
    try {
        await AdMob.initialize();

        await AdMob.showBanner({
            adId: 'ca-app-pub-6349209299551183/6488875896',
            adSize: BannerAdSize.ADAPTIVE_BANNER,
            position: BannerAdPosition.BOTTOM_CENTER,
            margin: 0,
            isTesting: true
        });

        console.log('AdMob banner started');
    } catch (error) {
        console.error('AdMob error:', error);
    }
}

createGame();
startAdMob();