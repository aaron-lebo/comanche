# comanche 

comanche is a 3d WebGL engine. It can currently render 30 different maps. 29 of them are reverse engineed by Sebastian Macke from the game Comanche, one of them is custom made by me. 

DISCLAIMER: the engine has no actual relation to the game, the maps are just in a convenient file format.

This is both a practical program and a tool for learning. The intention is for the source to always be as concise and understandable as possible. I've written more about its design and goals [here](http://lebo.io/2018/04/03/a-webgl-renderer.html). 

## install

    git clone ... && cd ...
    npm install
    npm install -g parcel-bundler
    parcel index.html

Parcel will hot reload upon any changes to the files. Currently this seems to not completely reload the page, which will degrade performance, but this is resolved by manually reloading.

You can also build a production copy via:

    parcel build entry.js --public-url ./
    
## contributing

I'm happy to accept any pull requests or modifications, though I'll be much more likely to accept them if you'll explain the purpose behind them. My goal is to increase functionality while keeping a consistent and lean design. Simpler is better. I've also got strong stylistic preferences, so there may be some reformatting on my end.

NOTICE: Any contributions are made with your agreement that they may at any time be dual licensed as ISC. The engine will remain GPLv3 for the forseeable future due to the protections it gives, but I'd like there to be as few restrictions as possible, eventually. There will be plenty of notice given before this happens.
