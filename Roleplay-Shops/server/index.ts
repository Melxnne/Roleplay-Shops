import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import * as Utility from '@Shared/utility/index.js';
import { Db } from 'mongodb';
import * as MoneyApi from '@Plugins/Roleplay-Core/server/apis/MoneyApi.js';
import * as InventoryApi from '@Plugins/Roleplay-Core/server/apis/InventoryApi.js';
import * as RPJobApi from '@Plugins/Roleplay-Core/server/apis/JobApi.js'; 
import * as RPFoodApi from '@Plugins/Roleplay-Core/server/apis/FoodApi.js'; 
import * as RPVehiclesApi from '@Plugins/Roleplay-Core/server/apis/VehiclesApi.js'; 
import { config } from '@Plugins/Roleplay-Core/shared/config.js'; 
import { useVehicle } from '@Server/vehicle/index.js';
import { Vehicle } from 'alt-server';
import { MarkerType } from '@Shared/types/marker.js';
import { Shops } from '@Plugins/Roleplay-Shops/shared/config.js';






MoneyApi.initfunc();
RPFoodApi.initfunc();
InventoryApi.initfunc();
RPJobApi.initfunc();
RPVehiclesApi.initfunc();

const Rebar = useRebar();
const { get, create, getMany, update } = Rebar.database.useDatabase();
const getter = Rebar.get.usePlayerGetter();
let isUpdatingPlayers = false;

const api = Rebar.useApi();

const [moneyAPI, inventoryAPI, JobApi, VehicleAPI] = await Promise.all([
    api.getAsync('rebar-rp-money-api'),
    api.getAsync('rebar-rp-inventory-api'), 
    api.getAsync('rebar-rp-job-api'),  
    api.getAsync('rebar-rp-vehicles-api')
]);


const esr = {
    ...moneyAPI,
    ...inventoryAPI,
    ...JobApi,
    ...VehicleAPI
};


//Global Functions

Shops.forEach((shop) => {
    const shopPos = new alt.Vector3(shop.position.x, shop.position.y, shop.position.z);

    const interaction = Rebar.controllers.useInteraction(
        new alt.ColshapeCylinder(shopPos.x, shopPos.y, shopPos.z, 5, 1),
        'player',
    );

    interaction.onEnter((player) => {
        const rPlayer = Rebar.usePlayer(player);
        rPlayer.notify.showNotification(`You entered ${shop.name}!`);
    });

    interaction.onLeave((player) => {
        const rPlayer = Rebar.usePlayer(player);
        rPlayer.notify.showNotification(`You left ${shop.name}!`);
    });

    interaction.on((player) => {
        const rPlayer = Rebar.usePlayer(player);
        alt.log(`Player ${rPlayer.character.getField('name')} interacted with ${shop.name}.`);
        openshop(player, shop.name);
        rPlayer.notify.showNotification(`Interacted with ${shop.name}!`);
    });



const shopPed = Rebar.controllers.usePed(
    new alt.Ped(shop.pedModel, new alt.Vector3(shop.position.x, shop.position.y, shop.position.z), new alt.Vector3(0, 0, shop.pedRot), 100)
);


    shopPed.setOption('makeStupid', true);
    shopPed.setOption('invincible', true);
    shopPed.invoke(
        'taskPlayAnim',
        'anim@amb@nightclub@mini@dance@dance_solo@female@var_a@',
        'med_center_up',
        8.0,
        8.0,
        -1,
        1,
        0,
        false,
        false,
        false,
    );

    // Add global marker, text label, and blip for the shop
    Rebar.controllers.useMarkerGlobal({
        pos: new alt.Vector3(shop.position.x, shop.position.y, shop.position.z - 0.5),
        color: new alt.RGBA(255, 165, 0, 75),
        scale: new alt.Vector3(2, 2, 1),
        type: MarkerType.CYLINDER,
    });

    Rebar.controllers.useTextLabelGlobal({
        pos: shopPos.add(0, 0, 1),
        text: `Press E to interact with ${shop.name}!`,
    });

    Rebar.controllers.useBlipGlobal({
        color: shop.blipcolor || 2,
        pos: shopPos,
        shortRange: true,
        sprite: shop.blipsprite || 52,
        text: shop.name,
    });
});





//Shopfunctions 

const messenger = Rebar.messenger.useMessenger();


const registerCommand = (name: string, desc: string, callback: Function, distanceType = 'normal') => {
    messenger.commands.register({
        name,
        desc,
        callback: async (player: alt.Player, ...args: string[]) => {
            if (args.length < 2) return; 
            await callback(player, ...args);
        }
    });
};


registerCommand('openshop', 'Openshop', async (player, shopname, arg) => {
    
    const rPlayer = Rebar.usePlayer(player);

    rPlayer.webview.show('ShopUi', 'page');
    rPlayer.world.disableCameraControls(true);
    rPlayer.world.disableControls();
    


    rPlayer.webview.emit('openshop', {
        type: 'update',
        player,
        shopname
    });




});

function openshop (player, shopname) {
    const rPlayer = Rebar.usePlayer(player);

    rPlayer.webview.show('ShopUi', 'page');
    rPlayer.world.disableCameraControls(true);
    rPlayer.world.disableControls();
    


    rPlayer.webview.emit('openshop', {
        type: 'update',
        player,
        shopname
    });

}

function closeshop (player) {
    
        alt.log("Console stopped the ShopUi")
        const rPlayer = Rebar.usePlayer(player);
        rPlayer.webview.hide('ShopUi');
        rPlayer.world.disableCameraControls(false);
        rPlayer.world.enableControls();
        };

alt.onClient('closeshop', ( player: alt.Player ) => {
    alt.log("Console stopped the ShopUi")
    const rPlayer = Rebar.usePlayer(player);
    rPlayer.webview.hide('ShopUi');
    rPlayer.world.disableCameraControls(false);
    rPlayer.world.enableControls();
    });

    alt.onClient('purchaseItems', async (player, items, totalPrice, purchaseMethod) => {
        try {
            
            alt.log(`[purchaseItems] Daten empfangen: ${JSON.stringify({ items, totalPrice, purchaseMethod })}`);
            
            
        const document = Rebar.document.character.useCharacter(player);
        const characterData = document.get();
        const rPlayer = Rebar.usePlayer(player);
            if (!document) {
                alt.logError('[purchaseItems] Spieler hat keinen gültigen Charakter.');
                closeshop(player);
                //rPlayer.notify.showNotification(`Erfolgreich ${totalPrice} gekauft.`);;
            }
    
            // Überprüfen, ob der Spieler genug Geld hat
            const hasEnoughMoney = await esr.hasCharacterEnough(characterData._id, totalPrice, purchaseMethod);
            if (!hasEnoughMoney) {
                rPlayer.notify.showNotification(`Du hast nicht genug ${purchaseMethod}, um den Einkauf abzuschließen.`);
                closeshop(player);
                return;
            }
    
            // Geld abziehen
            await esr.removeMoney(characterData._id, totalPrice, purchaseMethod);
            alt.log(`[purchaseItems] ${characterData.name} hat ${totalPrice} ${purchaseMethod} bezahlt.`);
    
            // Items zum Inventar hinzufügen
            for (const item of items) {
                const { name, quantity } = item;
                await esr.addInventoryItem(characterData._id, name, quantity);
                alt.log(`[purchaseItems] ${quantity}x ${name} zum Inventar von ${characterData.name} hinzugefügt.`);
                rPlayer.notify.showNotification(`[purchaseItems] ${quantity}x ${name} zum Inventar von ${characterData.name} hinzugefügt.`);
            }
    
            // Spieler-UI schließen
            rPlayer.webview.hide('ShopUi');
            rPlayer.world.disableCameraControls(false);
            rPlayer.world.enableControls();
            
            rPlayer.notify.showNotification(`Einkauf erfolgreich abgeschlossen!`);
        } catch (error) {
            alt.logError(`[purchaseItems] Fehler: ${error.message}`);
            const rPlayer = Rebar.usePlayer(player);
            rPlayer.notify.showNotification(`Fehler beim Verarbeiten des Einkaufs: ${error.message}`);
        }
    });





    

