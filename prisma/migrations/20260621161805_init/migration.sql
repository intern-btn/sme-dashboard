BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [displayName] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'viewer',
    [accessScope] NVARCHAR(1000) NOT NULL CONSTRAINT [User_accessScope_df] DEFAULT 'national',
    [kanwil] NVARCHAR(1000),
    [cabang] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [mustChangePassword] BIT NOT NULL CONSTRAINT [User_mustChangePassword_df] DEFAULT 0,
    [totpSecret] NVARCHAR(1000),
    [totpEnabled] BIT NOT NULL CONSTRAINT [User_totpEnabled_df] DEFAULT 0,
    [totpLastVerifiedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

-- CreateTable
CREATE TABLE [dbo].[TotpAttempt] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [context] NVARCHAR(1000) NOT NULL,
    [success] BIT NOT NULL,
    [ip] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TotpAttempt_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TotpAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SecurityAuditLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] NVARCHAR(1000) NOT NULL,
    [actorUserId] NVARCHAR(1000),
    [action] NVARCHAR(1000) NOT NULL,
    [dataType] NVARCHAR(1000),
    [ip] NVARCHAR(1000) NOT NULL,
    [userAgent] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [SecurityAuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [SecurityAuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Memo] (
    [id] NVARCHAR(1000) NOT NULL,
    [nomorMemo] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_nomorMemo_df] DEFAULT '',
    [category] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_category_df] DEFAULT 'general',
    [perihal] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_perihal_df] DEFAULT '',
    [kepada] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_kepada_df] DEFAULT '[]',
    [dari] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_dari_df] DEFAULT '',
    [tanggalMemo] DATETIME2 NOT NULL CONSTRAINT [Memo_tanggalMemo_df] DEFAULT CURRENT_TIMESTAMP,
    [konten] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_konten_df] DEFAULT '',
    [lampiranList] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_lampiranList_df] DEFAULT '[]',
    [tembusan] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_tembusan_df] DEFAULT '[]',
    [metadata] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_metadata_df] DEFAULT '{}',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_status_df] DEFAULT 'draft',
    [createdBy] NVARCHAR(1000) NOT NULL CONSTRAINT [Memo_createdBy_df] DEFAULT '',
    [reviewedBy] NVARCHAR(1000),
    [approvedBy] NVARCHAR(1000),
    [distributedBy] NVARCHAR(1000),
    [distributedTo] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_distributedTo_df] DEFAULT '[]',
    [attachments] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_attachments_df] DEFAULT '[]',
    [notes] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Memo_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [reviewedAt] DATETIME2,
    [approvedAt] DATETIME2,
    [distributedAt] DATETIME2,
    [trackingStep] INT NOT NULL CONSTRAINT [Memo_trackingStep_df] DEFAULT 0,
    [stepHistory] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_stepHistory_df] DEFAULT '[]',
    [slaHours] INT NOT NULL CONSTRAINT [Memo_slaHours_df] DEFAULT 8,
    [trackingRoles] NVARCHAR(max) NOT NULL CONSTRAINT [Memo_trackingRoles_df] DEFAULT '{}',
    [trackingStartedAt] DATETIME2,
    [trackingCompletedAt] DATETIME2,
    CONSTRAINT [Memo_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TotpAttempt_userId_context_createdAt_idx] ON [dbo].[TotpAttempt]([userId], [context], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SecurityAuditLog_userId_createdAt_idx] ON [dbo].[SecurityAuditLog]([userId], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [SecurityAuditLog_dataType_createdAt_idx] ON [dbo].[SecurityAuditLog]([dataType], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[TotpAttempt] ADD CONSTRAINT [TotpAttempt_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SecurityAuditLog] ADD CONSTRAINT [SecurityAuditLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SecurityAuditLog] ADD CONSTRAINT [SecurityAuditLog_actorUserId_fkey] FOREIGN KEY ([actorUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
