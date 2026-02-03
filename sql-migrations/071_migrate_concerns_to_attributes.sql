-- Migration: Consolidate skin_concerns into product_attributes system
-- Date: 2025-12-08
--
-- This migration:
-- 1. Updates customer_concerns foreign key to point to product_attribute_options
-- 2. Migrates existing concern_id values using the mapping
-- 3. Drops the deprecated skin_concerns table
-- 4. Drops the deprecated booster_concern_mapping table

-- Step 1: Drop the old foreign key constraint
ALTER TABLE customer_concerns DROP CONSTRAINT IF EXISTS customer_concerns_concern_id_fkey;

-- Step 2: Update existing concern_ids using the mapping
-- (These are the 30 skin_concern -> product_attribute_option mappings)
UPDATE customer_concerns SET concern_id = 'e9386917-dace-4908-a319-49c85fea38fc' WHERE concern_id = '66656506-9a98-4f1e-b21a-6bf9bfaa005a';
UPDATE customer_concerns SET concern_id = '088489c4-cc01-4641-9b57-eff6417a00a4' WHERE concern_id = '3a72c417-be0e-43a4-8460-d3adfbb5f02c';
UPDATE customer_concerns SET concern_id = '4c33f201-1f0e-4d14-84f4-56d08c7a08d3' WHERE concern_id = '33c3e56a-3d84-4b98-8455-33dc7234278e';
UPDATE customer_concerns SET concern_id = 'b4168850-b854-4491-a580-8a835f0b4bd8' WHERE concern_id = '26cc18e6-05e6-497f-875f-a28e808ddd55';
UPDATE customer_concerns SET concern_id = '15727b97-a811-4483-be5e-3b52d1c748cc' WHERE concern_id = '346de056-55cb-4532-b55a-f9d673d4a25c';
UPDATE customer_concerns SET concern_id = '3a3cbc95-d66f-45a1-b500-14859a929982' WHERE concern_id = 'd5c8b2d9-884e-4d1a-9921-f075c0ee2a1f';
UPDATE customer_concerns SET concern_id = '723a2e36-2484-4e29-b745-bab07a5f644a' WHERE concern_id = 'b98e1f00-dbd0-4de6-8197-68ca20f50a30';
UPDATE customer_concerns SET concern_id = 'ad6a4900-ebdb-4d0f-bffa-60e76881075c' WHERE concern_id = 'dd4ca25b-4ba4-4420-8981-c114f3d2af87';
UPDATE customer_concerns SET concern_id = 'd5332db8-08f5-4274-b904-eb4a4cd02e97' WHERE concern_id = '452c4d78-f45a-45a6-b476-5505c0c98058';
UPDATE customer_concerns SET concern_id = 'ee0498ff-df32-49d1-b455-dc75c8cb7532' WHERE concern_id = 'f90caeb9-a1ea-4d54-ba79-1cc270e2e461';
UPDATE customer_concerns SET concern_id = 'b20188d3-7e0a-4dce-84df-150b3388e9dc' WHERE concern_id = '02bda4f2-70fe-4d87-ae05-2f58fb8465d1';
UPDATE customer_concerns SET concern_id = 'e11fc079-8d39-451a-9bad-3109986f8a9f' WHERE concern_id = '076a1fec-7053-44a0-9baf-c5cf72fb0c09';
UPDATE customer_concerns SET concern_id = 'dc19fcfc-613b-4d4b-a721-4f69b6575049' WHERE concern_id = 'a9cda15f-733f-427a-8abd-e0b7e6213fb7';
UPDATE customer_concerns SET concern_id = '52b0f83c-0c74-4747-9a9c-d59036aead86' WHERE concern_id = 'da2d7321-d25b-4ab7-b1a5-fad3f31e164f';
UPDATE customer_concerns SET concern_id = '9a37c1bb-829b-4c44-8180-a027d789eced' WHERE concern_id = 'accc49e9-ab55-4976-8662-ad23929849d2';
UPDATE customer_concerns SET concern_id = 'fd33a486-8140-48a8-88df-1cc10f51d883' WHERE concern_id = '965a0022-1703-4193-8a2b-e9e8c0d9cd50';
UPDATE customer_concerns SET concern_id = '27e5da91-4318-4999-a0e0-c97a3e913bae' WHERE concern_id = 'd99e7627-1a9c-4aec-bfd8-8ad92e4e4193';
UPDATE customer_concerns SET concern_id = 'a0561d42-221c-4da4-9023-cbde83fde09b' WHERE concern_id = '403df023-c542-43fe-afdd-b0683b9101e3';
UPDATE customer_concerns SET concern_id = 'db70e1cb-a85d-477d-a262-244fb5968197' WHERE concern_id = 'fe8e5208-a087-42ef-a1e7-4e9153c17681';
UPDATE customer_concerns SET concern_id = '94e114ea-752b-4f70-946d-ce1646731d88' WHERE concern_id = '26bed115-6983-443d-bd4d-a8bec5ef11fe';
UPDATE customer_concerns SET concern_id = 'db5266ce-10d8-42c5-8dba-d2228811dcd9' WHERE concern_id = '9130cad5-2d63-4622-9118-9c61aa32d6e6';
UPDATE customer_concerns SET concern_id = '9aff7aef-ff77-4c36-8f8e-63321d648a12' WHERE concern_id = '8e6613ee-2efa-4ab0-b6de-4804289867b4';
UPDATE customer_concerns SET concern_id = 'e4ce2bef-a486-4c73-961b-2bb31d0bf892' WHERE concern_id = '265e2bb6-d408-49dc-9b35-f631ec7ceafc';
UPDATE customer_concerns SET concern_id = 'd5c834d3-bf33-4e75-a30b-eaf6802e6826' WHERE concern_id = '8beacae3-753f-4519-aabd-b3fcf9c5349b';
UPDATE customer_concerns SET concern_id = '6e6fb4b9-cb6c-4e46-84c4-5b83ce558e96' WHERE concern_id = '60b98d66-7cd9-4cd3-b201-61aba75a7871';
UPDATE customer_concerns SET concern_id = 'af439eaf-600f-4853-a5da-264a0ccc312d' WHERE concern_id = 'e5d218d6-a8e7-4bc6-9e46-3d5d16aae9c5';
UPDATE customer_concerns SET concern_id = '0919a892-8121-4f52-bdc2-acea90841b81' WHERE concern_id = '5aaa9020-59a0-42c0-8dda-1c8856cc4db5';
UPDATE customer_concerns SET concern_id = '0a8cca30-4566-4f3d-a74a-2330fcca6307' WHERE concern_id = '6b99cda7-c467-4782-b2e2-c09f7197e978';
UPDATE customer_concerns SET concern_id = 'df59a33d-9d28-433d-be16-e1ae1ebbe285' WHERE concern_id = 'e93a1911-92f2-4073-802d-fd5237be702d';
UPDATE customer_concerns SET concern_id = 'ee85a119-a0db-4bcd-b0a3-e40b3ef29144' WHERE concern_id = 'f4947a36-451d-4d58-88b7-5099a0e32072';

-- Step 3: Add the new foreign key constraint to product_attribute_options
ALTER TABLE customer_concerns
ADD CONSTRAINT customer_concerns_concern_id_fkey
FOREIGN KEY (concern_id) REFERENCES product_attribute_options(id);

-- Step 4: Drop the deprecated tables
DROP TABLE IF EXISTS booster_concern_mapping CASCADE;
DROP TABLE IF EXISTS skin_concerns CASCADE;

-- Note: The system now uses:
-- - product_attribute_options (instead of skin_concerns) for concern definitions
-- - product_attribute_values (instead of booster_concern_mapping) for product-concern links
-- - customer_concerns.concern_id -> product_attribute_options.id
