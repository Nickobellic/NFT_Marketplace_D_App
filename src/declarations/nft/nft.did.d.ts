import type { Principal } from '@dfinity/principal';
export interface NFT {
  'getAsset' : () => Promise<Array<number>>,
  'getCanID' : () => Promise<Principal>,
  'getName' : () => Promise<string>,
  'getOwner' : () => Promise<Principal>,
  'transferNFT' : (arg_0: Principal) => Promise<string>,
}
export interface _SERVICE extends NFT {}
