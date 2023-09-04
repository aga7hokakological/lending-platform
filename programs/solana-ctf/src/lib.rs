use anchor_lang::prelude::*;
// use std::mem::space_of;

declare_id!("2X7zzfhm3jT1RJexfy4N2Z5bfZCzHULizY8px16YPmkc");

#[program]
pub mod solana_ctf {
    use super::*;

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, token: Pubkey) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.authority = escrow.authority.key();
        escrow.token_account = token;
        escrow.amount = 0;
        Ok(())
    }

    pub fn deposit_money(ctx: Context<DepositMoney>, amount: u32) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let depositor = &mut ctx.accounts.depositor;

        // NOTE: missing same token check/can override data
        escrow.token_account = escrow.token_account.key();
        escrow.amount += amount;

        depositor.user = depositor.user.key();
        depositor.amount += amount;

        Ok(())
    }

    pub fn borrow_money(ctx: Context<BorrowMoney>, amount: u32) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let borrower = &mut ctx.accounts.borrower;

        // NOTE: missing amount check
        escrow.amount -= amount;

        borrower.user = borrower.user.key();
        borrower.borrowed = true;
        borrower.borrowed_amount += amount;

        Ok(())
    }

    pub fn deposit_borrowed_money(ctx: Context<DepositBorrowedMoney>, amount: u32) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let borrower = &mut ctx.accounts.borrower;

        if escrow.key() == borrower.escrow.key() {
            escrow.amount += amount;
            borrower.borrowed_amount -= amount;
        }

        Ok(())
    }

    pub fn withdraw_money(ctx: Context<WithdrawMoney>, amount: u32) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let withdrawer = &mut ctx.accounts.withdrawer;

        if escrow.key() == withdrawer.escrow.key() {
            escrow.amount -= amount;
            withdrawer.amount += amount;
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(
        // init,
        // payer = authority,
        seeds = [b"escrow"],
        bump,
        // space = size_of::<Escrow>()
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositMoney<'info> {
    pub depositor: Account<'info, Lender>,
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct BorrowMoney<'info> {
    pub borrower: Account<'info, Borrower>,
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct DepositBorrowedMoney<'info> {
    pub borrower: Account<'info, Borrower>,
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct WithdrawMoney<'info> {
    pub withdrawer: Account<'info, Lender>,
    pub escrow: Account<'info, Escrow>,
}

#[account] 
pub struct Lender {
    pub user: Pubkey,
    pub amount: u32,
    pub escrow: Pubkey,
    // pub minted_token: Pubkey,
    // pub minted_token_amount: u32,
}

#[account]
pub struct Borrower {
    pub user: Pubkey,
    pub escrow: Pubkey,
    pub borrowed: bool,
    pub borrowed_amount: u32,
}

#[account]
pub struct Escrow {
    pub token_account: Pubkey,
    pub amount: u32,
    pub authority: Pubkey,
    // pub minted_token: Pubkey,
    // pub withdraw_destination: Pubkey,
}
