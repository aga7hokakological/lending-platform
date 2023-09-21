import { join } from "path";
import { readFileSync } from "fs";import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, createMint, createAccount, MINT_SIZE, mintTo, getMint, createAssociatedTokenAccount, mintToChecked, TokenOwnerOffCurveError } from "@solana/spl-token";
import { StakingProgram } from "../target/types/staking_program";
import { assert } from "chai";
import TransactionFactory from "@coral-xyz/anchor/dist/cjs/program/namespace/transaction";

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

  // beforeEach(async () => {
    // airdrop to user
    // const airdropSignature = await provider.connection.requestAirdrop(
    //   user.publicKey,
    //   10 * LAMPORTS_PER_SOL
    // );
    // const latestBlockHash = await provider.connection.getLatestBlockhash();

    // await provider.connection.confirmTransaction({
    //   blockhash: latestBlockHash.blockhash,
    //     lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    //     signature: airdropSignature,
    // });

    // let tokenMintPubkey = await createMint(
    //   provider.connection,
    //   admin,
    //   admin.publicKey,
    //   null,
    //   9
    // );
    
    // let mintAccount = await getMint(provider.connection, tokenMintPubkey);
    // // console.log(mintAccount);
  
    // let adminTokenAccountTx = await createAssociatedTokenAccount(
    //   provider.connection,
    //   admin,
    //   tokenMintPubkey,
    //   admin.publicKey
    // );

    // let userTokenAccountTx = await createAssociatedTokenAccount(
    //   provider.connection,
    //   user,
    //   tokenMintPubkey,
    //   admin.publicKey
    // )
  
    // let txhash = await mintToChecked(
    //   provider.connection,
    //   admin,
    //   tokenMintPubkey,
    //   admin.publicKey,
    //   admin,
    //   100e9,
    //   9
    // )
    // console.log(txhash)

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
    
      // let adminTokenAccountTx = await createAssociatedTokenAccount(
      //   provider.connection,
      //   admin,
      //   tokenMintPubkey,
      //   admin.publicKey
      // );
  
      // let userTokenAccountTx = await createAssociatedTokenAccount(
      //   provider.connection,
      //   user,
      //   tokenMintPubkey,
      //   user.publicKey
      // )

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
      // Add your test here.
      const tx = await program.methods.initialize().accounts({
        admin: admin.publicKey,
        escrowAccount: pool.publicKey,
        stakingToken: tokenMintPubkey,
        tokenAccount: adminTokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId
      }).
      signers([admin, pool]).
      rpc();

      console.log("Your transaction signature", tx);
    });
  // })
});

// describe("solana-staking-blog", () => {
//   // Configure the client to use the local cluster.
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

//   const WALLET_PATH = join(process.env["HOME"]!, ".config/solana/id.json");
//   const admin = Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(readFileSync(WALLET_PATH, { encoding: "utf-8" })))
//   );
//   const user = Keypair.generate();
//   const poolInfo = Keypair.generate();
//   const userInfo = Keypair.generate();

//   let token;
//   let adminTokenAccount: PublicKey;
//   let userTokenAccount: PublicKey;

//   before(async () => {
//     const airdropSignature = await provider.connection.requestAirdrop(
//       user.publicKey,
//       10 * LAMPORTS_PER_SOL
//     );
//     const latestBlockHash = await provider.connection.getLatestBlockhash();

//     await provider.connection.confirmTransaction({
//       blockhash: latestBlockHash.blockhash,
//         lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
//         signature: airdropSignature,
//     }
//       // "confirmed"
//     );

//     token = await createMint(
//       provider.connection,
//       admin,
//       admin.publicKey,
//       null,
//       9,
//       // TOKEN_2022_PROGRAM_ID
//     );

//     adminTokenAccount = await createAccount(
//       provider.connection, 
//       admin,
//       admin.publicKey,
//       admin.publicKey
//       );
//     userTokenAccount = await createAccount(
//       provider.connection,
//       user,
//       user.publicKey,
//       user.publicKey
//       );

//     await mintTo(
//       provider.connection,
//       admin,
//       token,
//       userTokenAccount, 
//       admin.publicKey, 
//       1e10);
//   });

//   it("Initialize", async () => {
//     let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
//     assert.strictEqual(_adminTokenAccount.amount.toNumber(), 0);

//     const tx = await program.methods
//       .initialize(new BN(1), new BN(1e10))
//       .accounts({
//         admin: admin.publicKey,
//         poolInfo: poolInfo.publicKey,
//         stakingToken: token.publicKey,
//         adminStakingWallet: adminTokenAccount,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([admin, poolInfo])
//       .rpc();
//       console.log(tx)
//     console.log("Your transaction signature", tx);
//   });

//   it("Stake", async () => {
//     let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
//     assert.strictEqual(_userTokenAccount.amount.toNumber(), 1e10);

//     const tx = await program.methods
//       .stake(new BN(1e10))
//       .accounts({
//         user: user.publicKey,
//         admin: admin.publicKey,
//         userInfo: userInfo.publicKey,
//         userStakingWallet: userTokenAccount,
//         adminStakingWallet: adminTokenAccount,
//         stakingToken: token.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//         systemProgram: SystemProgram.programId,
//       })
//       .signers([user, userInfo])
//       .rpc();
//     console.log("Your transaction signature", tx);

//     let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
//     assert.strictEqual(_adminTokenAccount.amount.toNumber(), 1e10);
//   });

//   it("Claim Reward", async () => {
//     let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
//     assert.strictEqual(_adminTokenAccount.amount.toNumber(), 1e10);

//     const tx = await program.methods
//       .claimReward()
//       .accounts({
//         user: user.publicKey,
//         admin: admin.publicKey,
//         userInfo: userInfo.publicKey,
//         userStakingWallet: userTokenAccount,
//         adminStakingWallet: adminTokenAccount,
//         stakingToken: token.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();
//     console.log("Your transaction signature", tx);

//     let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
//     assert.strictEqual(_userTokenAccount.amount.toNumber(), 1);
//   });

//   it("Unstake", async () => {
//     let _adminTokenAccount = await token.getAccountInfo(adminTokenAccount);
//     assert.strictEqual(_adminTokenAccount.amount.toNumber(), 1e10);

//     const tx = await program.methods
//       .unstake()
//       .accounts({
//         user: user.publicKey,
//         admin: admin.publicKey,
//         userInfo: userInfo.publicKey,
//         userStakingWallet: userTokenAccount,
//         adminStakingWallet: adminTokenAccount,
//         stakingToken: token.publicKey,
//         tokenProgram: TOKEN_PROGRAM_ID,
//       })
//       .rpc();
//     // console.log(tx)
//     console.log("Your transaction signature", tx);

//     let _userTokenAccount = await token.getAccountInfo(userTokenAccount);
//     assert.strictEqual(_userTokenAccount.amount.toNumber(), 1e10 + 2);
//   });
// });