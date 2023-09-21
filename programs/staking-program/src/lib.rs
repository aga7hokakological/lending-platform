use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo, Transfer};
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

declare_id!("EKqX4UHZW8LjUpyte77f6U1TydESn2dJQb6NGA91UBin");

#[program]
pub mod staking_program {
    use super::*;
 
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;

        escrow_account.admin = ctx.accounts.admin.key();
        escrow_account.token = ctx.accounts.staking_token.key();
        escrow_account.total_amount = 0;

        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;

        let clock_time = Clock::get()?;

        if user_account.amount > 0 {
            let reward = (clock_time.slot - user_account.deposit_time) - user_account.reward_debt;

            // MAYBE CREATE A LOGIC BUG HERE
            let cpi_accounts = MintTo {
                mint: ctx.accounts.staking_token.to_account_info(),
                to: ctx.accounts.user_staking_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_account.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::mint_to(cpi_ctx, reward)?;
        }

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_staking_account.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_account.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        user_account.amount += amount;
        user_account.deposit_time = clock_time.slot;
        user_account.reward_debt = 0;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;

        let clock_time = Clock::get()?;

        let reward = (clock_time.slot - user_account.deposit_time) - user_account.reward_debt;

        let cpi_accounts = MintTo {
            mint: ctx.accounts.staking_token.to_account_info(),
            to: ctx.accounts.user_staking_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_account.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, reward)?;

        let cpi_accounts = Transfer {
            from: ctx.accounts.token_account.to_account_info(),
            to: ctx.accounts.user_staking_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_account.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, user_account.amount)?;

        user_account.amount += 0;
        user_account.deposit_time = 0;
        user_account.reward_debt = 0;

        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;

        let clock_time = Clock::get()?;

        let reward = (clock_time.slot - user_account.deposit_time) - user_account.reward_debt;

        let cpi_accounts = MintTo {
            mint: ctx.accounts.staking_token.to_account_info(),
            to: ctx.accounts.user_staking_account.to_account_info(),
            authority: ctx.accounts.admin.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_account.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, reward)?;

        user_account.reward_debt += reward;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The owner of the escrow account
    #[account(mut)]
    pub admin: Signer<'info>,
    /// Escrow account in which the tokens are to be staked
    #[account(init, payer = admin, space = 8 + Escrow::LEN)]
    pub escrow_account: Account<'info, Escrow>,
    /// The token which is going to be staked
    #[account(mut)]
    pub staking_token: InterfaceAccount<'info, Mint>,
    /// ATA of the token for admin
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Stake<'info> {
    /// User who is going to stake
    #[account(mut)]
    pub user: Signer<'info>,
    /// User account who is going to stake
    #[account(init, payer = user, space = 8 + User::LEN)]
    pub user_account: Account<'info, User>,
    /// CHECK: Just to check the owner
    #[account(mut)]
    pub admin: AccountInfo<'info>,
    /// The token which is going to be staked
    #[account(mut)]
    pub staking_token: InterfaceAccount<'info, Mint>,
    /// ATA of the token for user
    #[account(mut)]
    pub user_staking_account: InterfaceAccount<'info, TokenAccount>,
    /// ATA of the token for admin
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    /// The token program for the token staking token
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    /// User who is going to stake
    #[account(mut)]
    pub user: Signer<'info>,
    /// User account who is going to stake
    #[account(mut)]
    pub user_account: Account<'info, User>,
    /// CHECK: Just to check the owner
    #[account(mut)]
    pub admin: AccountInfo<'info>,
    /// The token which is going to be staked
    #[account(mut)]
    pub staking_token: InterfaceAccount<'info, Mint>,
    /// ATA of the token for user
    #[account(mut)]
    pub user_staking_account: InterfaceAccount<'info, TokenAccount>,
    /// ATA of the token for admin
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    /// The token program for the token staking token
    pub token_program: Interface<'info, TokenInterface>
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    /// User who is going to stake
    #[account(mut)]
    pub user: Signer<'info>,
    /// User account who is going to stake
    #[account(mut)]
    pub user_account: Account<'info, User>,
    /// CHECK: Just to check the owner
    #[account(mut)]
    pub admin: AccountInfo<'info>,
    /// The token which is going to be staked
    #[account(mut)]
    pub staking_token: InterfaceAccount<'info, Mint>,
    /// ATA of the token for user
    #[account(mut)]
    pub user_staking_account: InterfaceAccount<'info, TokenAccount>,
    /// ATA of the token for admin
    #[account(mut)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,
    /// The token program for the token staking token
    pub token_program: Interface<'info, TokenInterface>,
} 

#[account]
pub struct Escrow {
    pub admin: Pubkey,
    pub token: Pubkey,
    pub total_amount: u64
    // pub bump: u8
}

#[account]
pub struct User {
    pub amount: u64,
    pub reward_debt: u64,
    pub deposit_time: u64
}

impl User {
    pub const LEN: usize = 8 + 8 + 8;
}
 
impl Escrow {
    pub const LEN: usize = 32 + 32 + 8 + 2;
}