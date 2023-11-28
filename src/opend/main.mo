import Principal "mo:base/Principal";
import NFTActor "../NFT/nft";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";

actor OpenD {
 
    private type Listing = {
        itemOwner: Principal;       // Creating a new Data Type for Listing
        itemPrice: Nat;
    };

    var nftMaps = HashMap.HashMap<Principal, NFTActor.NFT>(1, Principal.equal, Principal.hash); // HashMap between Owners and NFTs
    var ownerMaps = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash); // HashMap between Owners and list of NFTs
    var listingMaps = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash); // HashMap between Owners and NFT Listing

    public shared(msg) func mint(image: [Nat8], name: Text) : async Principal {     // Function to mint the NFT

        let owner: Principal = msg.caller;      // To fetch the ID of the requested Client

        Debug.print(debug_show(Cycles.balance()));      // To print the total cycles present in the ICP Block Chain
        Cycles.add(100_500_000_000);                    // To add cycles to ICP Blockchain

        let newNFT = await NFTActor.NFT(name, owner, image);        // Creating a new NFT through NFTActor class

        let newNFTPrincipal = await newNFT.getCanID();              // Getting the Canister ID(NFT)
        
        nftMaps.put(newNFTPrincipal, newNFT);       // Mapping NFT ID with the Owner's Principal ID
        addToOwnersMap(owner, newNFTPrincipal);     // Adding the Owner to the Owners Map if he's not present in the list. Otherwise, append the NFT ID to the existing List
        
        Debug.print(debug_show(Cycles.balance()));  
        return newNFTPrincipal;                     // Returns NFT ID
    };

    private func addToOwnersMap(owner: Principal, nftID: Principal) {       // Function to add Owners and NFT to the Owners Map
        var ownedNFTs : List.List<Principal> = switch (ownerMaps.get(owner)) {
            case null List.nil<Principal>();                                    // Switch statement to check whether owner is already present
            case (?result) result;
        };

        ownedNFTs := List.push(nftID, ownedNFTs);               // If present, Push the NFT ID to the existing list. Reassign to the same lists

        ownerMaps.put(owner, ownedNFTs);                        // Add the updated list to the Owners Map
    };

    public query func getOwnedNFTs(user: Principal): async [Principal] {            // Function to get NFT's owned by a particular Owner ID
        var nftLists: List.List<Principal> = switch (ownerMaps.get(user)) {
            case null List.nil<Principal>();                                    // Switch statement to check whether owner ID is available in the ownerMaps HashMap
            case (?result) result;
        };

        return List.toArray(nftLists);                              // Returning the NFTs as an Array for Front End to display
    };

    public query func getListedNFTs(): async [Principal] {      // Get the list of NFTs that are owned by OpenD (i.e NFTs that are sold by seller and kept by OpenD till it gets bought)
        let listIDs = Iter.toArray(listingMaps.keys());     // Returns the Principal IDs of NFTs. Returns it as an Array for React front end

        return listIDs;
    };

    public shared(msg) func listItem(id: Principal, price: Nat): async Text { // Function to fire after an NFT is sold by the Owner
        var nft : NFTActor.NFT = switch(nftMaps.get(id)) {      // Check whether the NFT is present inside the list of NFTs
            case null return "NFT does not exist";
            case (?result) result;                                                          
        };

        let owner = await nft.getOwner();                       // Get the Owner's Principal ID

        if(Principal.equal(owner, msg.caller)) {
            let newListing : Listing = {                    // Switch statement to check whether Sell request is given by the same Seller.
                itemOwner = owner;
                itemPrice = price;
            };

            listingMaps.put(id, newListing);           // Adding the details as a HashMap element inside listingMaps HashMap
            return "Success";

        } else {
            return "Access Denied";                    // Else deny the request
        }

    };


    public query func getOpenDCanID(): async Principal {                    // Gets the Canister ID of OpenD
        return Principal.fromActor(OpenD);
    };

    public query func isListed(id: Principal): async Bool {             // Returns whether the passed NFT ID is present in Listing or not
        if(listingMaps.get(id) == null) {
            return false;
        } else {
            return true;
        }
    }; 

    public query func getOriginalOwner(nftid: Principal): async Principal { // Returns Principal type by giving nft ID as argument
        var lists: Listing = switch(listingMaps.get(nftid)) {
            case null return Principal.fromText(""); // Case when Listing is not found
            case (?result) result;  // Case when listing is found
        };

        return lists.itemOwner;
    };

    public query func getPriceOfListedNFT(nftid: Principal): async Nat { // Returns price of the listed NFTS
        var price: Listing = switch(listingMaps.get(nftid)) { // Returns the particular listing HashMap if it is available
            case null return 0;
            case (?result) result;
        };

        return price.itemPrice;
    };

    public shared(msg) func purchaseNFT(id: Principal, ownerID: Principal, newOwnerID: Principal): async Text {
        var thatNFT: NFTActor.NFT = switch(nftMaps.get(id)) {
            case null return "404 Error";                               // Finding that particular NFT's Actor Class and its IDs
            case (?result) result;
        };

        let transferThatNFT = await thatNFT.transferNFT(newOwnerID);  // Transfering the NFT to the New Owner
        if(transferThatNFT == "Success") {
            listingMaps.delete(id); // Deleting that NFT ID from Listing by Open D so that it won't be shown on sale
            var ownedNFTs: List.List<Principal> = switch(ownerMaps.get(ownerID)) { // Finding the Old Owner's List of Owned NFTs to delete the sold NFT
                case null List.nil<Principal>();
                case (?result) result;
            };

            ownedNFTs := List.filter(ownedNFTs, func (listItemID: Principal) : Bool {
                return listItemID != id;    // Returns NFT IDs that aren't matching the Argument's NFT ID
            });

            addToOwnersMap(newOwnerID, id); // Adding NFT ID to the New Owner's List of Owned NFTs
            return "Success";
        }
        else {
            return "Error";
        }



    }

};
