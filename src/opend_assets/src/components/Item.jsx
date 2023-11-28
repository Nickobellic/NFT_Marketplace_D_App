import { useEffect, useState } from "react";
import React from "react";
import logo from "../../assets/logo.png";
import { opend } from "../../../declarations/opend";
import Button from "../components/Button";
import { idlFactory as tokenIdl} from "../../../declarations/token"; // IDL Factory is responsible for the communication between Frontend and NFT, Tokens
import { idlFactory } from "../../../declarations/nft";
import {HttpAgent, Actor} from "@dfinity/agent";
import {Principal} from "@dfinity/principal";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";

function Item({id, role}) {
  const [nftName, setNFTName] = useState("");
  const [nftOwner, setNFTOwner] = useState("");
  const [needDisplay, setNeedDisplay] = useState(true); // Variable which keeps track of NFTs that have been under purchasing process for hiding the NFT
  const [nftImage, setNFTImage] = useState();
  const [loading, setLoading] = useState(true);
  const [listed, setListed] = useState();
  const [sellButton, setSellButton] = useState();
  const [priceInput, setPriceInput] = useState();
  const [priceLabel, setPriceLabel] = useState();
  const [blur, setBlur] = useState();

  const localHost = "http://localhost:8080/";
  const princId = Principal.fromText(id); // Converting from Principal to Text(i.e) String
  const agent = new HttpAgent( { host: localHost}); // Only for Local Development to overcome certificate issues
  agent.fetchRootKey();
  let NFTActor;

  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: princId
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageUint = new Uint8Array(imageData);

    const imageBlob = URL.createObjectURL(new Blob([imageUint.buffer], {
      type: "image/png"
    }));

    setNFTOwner(owner.toText());
    setNFTName(name);
    setNFTImage(imageBlob);


    if(role == "Collection") { // NFT under conditions for MyNFTs page
    const listedStatus = await opend.isListed(princId);

    if(listedStatus) {  // If the NFT is listed for Sale. This shoulld apply in My NFTs page
      setNFTOwner("OpenD");
      setBlur({
        filter: "blur(4px)"
      });
    } else {
      setSellButton(<Button handleClick={handleSell} text={"Sell"}/>);
    }
    } else if(role == "Discover") { // NFTs under conditions in Discover page
      const origOwner = await opend.getOriginalOwner(princId); // Fetching the Original Owner
      const nftPrice = await opend.getPriceOfListedNFT(princId); // Fetching the price of the listed NFT
      setPriceLabel(<PriceLabel price={nftPrice.toString()} />); // Setting up Price Label
       
      if(origOwner.toText() != CURRENT_USER_ID.toText()) { // Chech whether the previous Original Owner is the Current User or not. Flow for the other user case
        setSellButton(<Button handleClick={handleBuy} text={"Buy"}/>);
 
      }
      setBlur();
    }

  }

  useEffect(() => {
    loadNFT();
  }, [])

  async function sellNFT() { // Functionality of Selling NFTs (It gets transferred to OpenD account)
    console.log("Clicked: Price - " + price);
    setBlur({
      filter: "blur(4px)"
    });
    setLoading(false);
    const result = await opend.listItem(princId, Number(price));
    if(result == "Success") {
      const opendID = await opend.getOpenDCanID();
      const transferRes = await NFTActor.transferNFT(opendID);
      if(transferRes == "Success") {
        setLoading(true);
        setListed(" Listed");
        setSellButton();
        setPriceInput();
        setNFTOwner("OpenD");
      }
    }
  }


  let price;
  async function handleSell() {
    setPriceInput(
      <input
          placeholder="Price in DANG"
          type="number"
          className="price-input"
          value={price}
          onChange={(e) => price=e.target.value}
        />
      );
    
    setSellButton(<Button handleClick={sellNFT} text={"Confirm"}/>);
  }

  async function handleBuy() {
    console.log("Bought ");
    setLoading(false);
    const tokenActor = await Actor.createActor(tokenIdl, {
      agent,
      canisterId: Principal.fromText("tlwi3-3aaaa-aaaaa-aaapq-cai")
    });

    const sellerID = await opend.getOriginalOwner(princId);
    const price = await opend.getPriceOfListedNFT(princId);

    const status = await tokenActor.transfer(sellerID, price);
    console.log(status);

    if(status == "Success") {
      let purchaseStatus = await opend.purchaseNFT(princId, sellerID, CURRENT_USER_ID); // Calling the Buy function to finish purchase

      console.log(`Purchase Status : ${purchaseStatus}`);
      setLoading(true);
      setNeedDisplay(false);
    }

  }

  return (
    <div style={
      {
        display: needDisplay ? "inline" : "none"
      }
    } className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={nftImage}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loading}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {nftName}<span className="purple-text"> {listed}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {nftOwner}
          </p>
          {priceInput}
          {sellButton}
        </div>
      </div>
    </div>
  );
}

export default Item;
