import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

actor class NFT (name: Text, owner: Principal, content: [Nat8]) = this {

    private let itemName = name;
    private var nftOwner = owner;
    private let imageBytes = content;

    public query func getName () : async Text {
        return itemName;                                      // Function to get the name of Owner
    };

    public query func getOwner () : async Principal {       // Function to get the name of the Owner's ID
        return nftOwner;
    };

    public query func getAsset () : async [Nat8] {          // Function to get NFT Asset in Bytes
        return imageBytes;
    };

    public query func getCanID () : async Principal {       // Function to get Canister ID of the Caller
        return Principal.fromActor(this);
    };

    public shared(msg) func transferNFT(newOwner: Principal): async Text {      // Function to Transfer NFT control from one user to another user
        if(msg.caller == nftOwner) {
            nftOwner := newOwner;
            return "Success";
        } else {
            return "Error: You can't perform Transfer for this NFT";
        }
    }; 

    Debug.print("NFT Actor");
};