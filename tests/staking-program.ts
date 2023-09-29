import { join } from "path";
import { readFileSync } from "fs";
import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, createMint, createAccount, MINT_SIZE, mintTo, getMint, createAssociatedTokenAccount, mintToChecked, TokenOwnerOffCurveError, getAccount } from "@solana/spl-token";
import { StakingProgram } from "../target/types/staking_program";
import { assert } from "chai";
import TransactionFactory from "@coral-xyz/anchor/dist/cjs/program/namespace/transaction";
import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

describe("staking-program", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  const WALLET_PATH = join(process.env["HOME"]!, ".config/solana/id.json");
  const admin = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(readFileSync(WALLET_PATH, { encoding: "utf-8" })))
  );

  const pool = anchor.web3.Keypair.generate();
  const user = anchor.web3.Keypair.generate();

  let token;
  let adminTokenAccount;
  let userTokenAccount;

  const [escrowPDA] = await anchor.web3.PublicKey.findProgramAddressSync([
    utf8.encode("escrow"),
    admin.publicKey.toBuffer(),
  ],
    program.programId
  );

    it("Is initialized!", async () => {
      const airdropSignature = await provider.connection.requestAirdrop(
        user.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      const latestBlockHash = await provider.connection.getLatestBlockhash();
  
      await provider.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: airdropSignature,
      });
  
      let tokenMintPubkey = await createMint(
        provider.connection,
        admin,
        admin.publicKey,
        null,
        9
      );
      
      let mintAccount = await getMint(provider.connection, tokenMintPubkey);
      // console.log(mintAccount);

      userTokenAccount = await createAccount(
        provider.connection,
        user,
        tokenMintPubkey,
        user.publicKey    
      )
      // console.log(userTokenAccount)

      adminTokenAccount = await createAccount(
        provider.connection,
        admin,
        tokenMintPubkey,
        admin.publicKey
      )
      // console.log(adminTokenAccount)
    
      let txhash = await mintToChecked(
        provider.connection,
        admin,
        tokenMintPubkey,
        admin.publicKey,
        admin,
        100e9,
        9
      )
      console.log(txhash)
      // Add your test here
      let _adminTokenAccount = await getAccount(provider.connection, adminTokenAccount);
      console.log(_adminTokenAccount.address)
      // const tx = await program.methods.initialize().accounts({
      //   admin: admin.publicKey,
      //   escrowAccount: escrowPDA,
      //   stakingToken: tokenMintPubkey,
      //   tokenAccount: adminTokenAccount,
      //   systemProgram: anchor.web3.SystemProgram.programId
      // }).
      // signers([admin, pool]).rpc();

      console.log("Your transaction signature", tx);
    });

    it("I think you can take out money event though it's mine",async () => {
      
    })
});
