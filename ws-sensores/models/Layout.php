<?php

namespace app\models;

use yii\db\ActiveRecord;

/**
 * This is the model class for table "layouts".
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property array $data
 * @property string $created_at
 * @property string $updated_at
 */
class Layout extends ActiveRecord
{
    public static function tableName()
    {
        return 'layouts';
    }

    public function rules()
    {
        return [
            [['tenant_id', 'name', 'data'], 'required'],
            [['tenant_id'], 'integer'],
            [['data', 'created_at', 'updated_at'], 'safe'],
            [['name'], 'string', 'max' => 255],
            [['tenant_id'], 'exist', 'skipOnError' => true, 'targetClass' => Tenant::class, 'targetAttribute' => ['tenant_id' => 'id']],
        ];
    }

    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'tenant_id' => 'Tenant ID',
            'name' => 'Name',
            'data' => 'Data',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
        ];
    }

    public function getTenant()
    {
        return $this->hasOne(Tenant::class, ['id' => 'tenant_id']);
    }
}
